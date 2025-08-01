import * as vscode from "vscode";
import { PackageDependency } from "../types";
import { BaseDependencyParser } from "./BaseDependencyParser";

export interface IGoModParser {
  parseFile(filePath: string): Promise<PackageDependency[]>;
}

export class GoModParser extends BaseDependencyParser implements IGoModParser {
  public getEcosystem(): string {
    return "Go";
  }

  public getSupportedFileTypes(): string[] {
    return ["go.mod"];
  }

  public async parseFile(filePath: string): Promise<PackageDependency[]> {
    try {
      const document = await vscode.workspace.openTextDocument(filePath);
      const content = document.getText();
      const dependencies: PackageDependency[] = [];

      const lines = content.split("\n").map((line) => line.trim());
      let inRequireBlock = false;

      for (const line of lines) {
        if (line.startsWith("require (")) {
          inRequireBlock = true;
          continue;
        }

        if (inRequireBlock && line === ")") {
          inRequireBlock = false;
          continue;
        }

        if (line.startsWith("require ") || inRequireBlock) {
          const dependency = this.parseDependencyLine(line, inRequireBlock);
          if (dependency) {
            dependencies.push(dependency);
          }
        }
      }

      return dependencies.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      throw new Error(
        `Failed to parse go.mod at ${filePath}: ${(error as Error).message}`
      );
    }
  }

  private parseDependencyLine(
    line: string,
    inBlock: boolean
  ): PackageDependency | null {
    let cleanLine = line.trim();

    if (!inBlock && cleanLine.startsWith("require ")) {
      cleanLine = cleanLine.substring(8).trim();
    }

    if (
      !cleanLine ||
      cleanLine.startsWith("//") ||
      cleanLine.startsWith("replace ")
    ) {
      return null;
    }

    const match = cleanLine.match(/^([^\s]+)\s+([^\s]+)(?:\s+\/\/.*)?$/);

    if (!match) {
      return null;
    }

    const [, name, version] = match;
    const isIndirect = cleanLine.includes("// indirect");
    const dependencyType = isIndirect ? "devDependency" : "dependency";

    return this.createDependency(
      name.trim(),
      version.trim(),
      dependencyType,
      this.getEcosystem()
    );
  }
}
