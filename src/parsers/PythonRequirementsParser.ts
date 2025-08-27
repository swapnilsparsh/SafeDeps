import * as vscode from "vscode";
import { PackageDependency } from "../types";
import { BaseDependencyParser } from "./BaseDependencyParser";

export interface IPythonRequirementsParser {
  parseFile(filePath: string): Promise<PackageDependency[]>;
}

export class PythonRequirementsParser
  extends BaseDependencyParser
  implements IPythonRequirementsParser
{
  public getEcosystem(): string {
    return "PyPI";
  }

  public getSupportedFileTypes(): string[] {
    return ["requirements.txt"];
  }

  public async parseFile(filePath: string): Promise<PackageDependency[]> {
    try {
      const document = await vscode.workspace.openTextDocument(filePath);
      const content = document.getText();
      const dependencies: PackageDependency[] = [];

      const lines = content.split("\n").map((line) => line.trim());

      for (const line of lines) {
        if (!line || line.startsWith("#") || line.startsWith("-")) {
          continue;
        }

        const dependency = this.parseDependencyLine(line);
        if (dependency) {
          dependencies.push(dependency);
        }
      }

      return dependencies.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      throw new Error(
        `Failed to parse requirements.txt at ${filePath}: ${
          (error as Error).message
        }`
      );
    }
  }

  private parseDependencyLine(line: string): PackageDependency | null {
    // Remove extras like [dev] from package names
    const cleanLine = line.replace(/\[.*?\]/g, "");

    // Handle different requirement formats
    const patterns = [
      // Standard format: package==1.0.0, package>=1.0.0, etc.
      /^([a-zA-Z0-9\-_.]+)(?:(==|>=|<=|>|<|~=|!=)(.+))?$/,
      // Git URLs
      /^git\+https?:\/\/.*#egg=([a-zA-Z0-9\-_.]+)/,
      // Local paths
      /^\.\/.*#egg=([a-zA-Z0-9\-_.]+)/,
    ];

    for (const pattern of patterns) {
      const match = cleanLine.match(pattern);
      if (match) {
        const [, name, operator, versionSpec] = match;

        // Skip git and local dependencies for vulnerability checking
        if (cleanLine.includes("git+") || cleanLine.includes("./")) {
          return null;
        }

        const version =
          operator && versionSpec
            ? `${operator}${versionSpec.trim()}`
            : "latest";

        return this.createDependency(
          name.trim(),
          version,
          "dependency",
          this.getEcosystem()
        );
      }
    }

    return null;
  }
}
