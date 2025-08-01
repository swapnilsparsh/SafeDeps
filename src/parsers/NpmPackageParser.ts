import * as vscode from "vscode";
import { PackageDependency } from "../types";
import { BaseDependencyParser } from "./BaseDependencyParser";

export class NpmPackageParser extends BaseDependencyParser {
  public getEcosystem(): string {
    return "npm";
  }

  public getSupportedFileTypes(): string[] {
    return ["package.json"];
  }

  public async parseFile(filePath: string): Promise<PackageDependency[]> {
    try {
      const document = await vscode.workspace.openTextDocument(filePath);
      const content = document.getText();
      const packageJson = JSON.parse(content);

      const dependencies: PackageDependency[] = [];

      if (packageJson.dependencies) {
        this.parseDependencySection(
          packageJson.dependencies,
          "dependency",
          dependencies
        );
      }

      if (packageJson.devDependencies) {
        this.parseDependencySection(
          packageJson.devDependencies,
          "devDependency",
          dependencies
        );
      }

      if (packageJson.peerDependencies) {
        this.parseDependencySection(
          packageJson.peerDependencies,
          "peerDependency",
          dependencies
        );
      }

      if (packageJson.optionalDependencies) {
        this.parseDependencySection(
          packageJson.optionalDependencies,
          "optionalDependency",
          dependencies
        );
      }

      return dependencies.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      throw new Error(
        `Failed to parse package.json at ${filePath}: ${
          (error as Error).message
        }`
      );
    }
  }

  private parseDependencySection(
    dependencies: Record<string, string>,
    type: PackageDependency["type"],
    targetArray: PackageDependency[]
  ): void {
    for (const [name, version] of Object.entries(dependencies)) {
      targetArray.push(
        this.createDependency(name, version, type, this.getEcosystem())
      );
    }
  }
}
