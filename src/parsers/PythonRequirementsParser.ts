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
    const cleanLine = line.replace(/\[.*?\]/g, "");

    const match = cleanLine.match(
      /^([a-zA-Z0-9\-_.]+)(?:(==|>=|<=|>|<|~=|!=)(.+))?$/
    );

    if (!match) {
      return null;
    }

    const [, name, operator, versionSpec] = match;
    const version =
      operator && versionSpec ? `${operator}${versionSpec.trim()}` : "latest";

    return this.createDependency(
      name.trim(),
      version,
      "dependency",
      this.getEcosystem()
    );
  }
}
