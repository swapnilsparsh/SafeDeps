import * as vscode from "vscode";
import { PackageDependency, PackageJsonInfo } from "../types";

export interface IPackageJsonParser {
  parsePackageJson(filePath: string): Promise<PackageJsonInfo>;
  parseAllPackageJsonFiles(
    packageJsonFiles: { filePath: string }[]
  ): Promise<PackageJsonInfo[]>;
}

export class PackageJsonParser implements IPackageJsonParser {
  public async parsePackageJson(filePath: string): Promise<PackageJsonInfo> {
    try {
      const document = await vscode.workspace.openTextDocument(filePath);
      const content = document.getText();
      const packageJson = JSON.parse(content);

      const dependencies: PackageDependency[] = [];
      const counts = {
        dependencies: 0,
        devDependencies: 0,
        peerDependencies: 0,
        optionalDependencies: 0,
      };

      if (packageJson.dependencies) {
        this.parseDependencySection(
          packageJson.dependencies,
          "dependency",
          dependencies,
          counts
        );
      }

      if (packageJson.devDependencies) {
        this.parseDependencySection(
          packageJson.devDependencies,
          "devDependency",
          dependencies,
          counts
        );
      }

      if (packageJson.peerDependencies) {
        this.parseDependencySection(
          packageJson.peerDependencies,
          "peerDependency",
          dependencies,
          counts
        );
      }

      if (packageJson.optionalDependencies) {
        this.parseDependencySection(
          packageJson.optionalDependencies,
          "optionalDependency",
          dependencies,
          counts
        );
      }

      dependencies.sort((a, b) => a.name.localeCompare(b.name));

      const relativePath = vscode.workspace.asRelativePath(filePath, false);

      return {
        filePath,
        relativePath,
        packageName: packageJson.name,
        version: packageJson.version,
        dependencies,
        totalDependencies: dependencies.length,
        dependencyCounts: counts,
      };
    } catch (error) {
      throw new Error(
        `Failed to parse package.json at ${filePath}: ${
          (error as Error).message
        }`
      );
    }
  }

  public async parseAllPackageJsonFiles(
    packageJsonFiles: { filePath: string }[]
  ): Promise<PackageJsonInfo[]> {
    const results: PackageJsonInfo[] = [];

    for (const file of packageJsonFiles) {
      try {
        const packageInfo = await this.parsePackageJson(file.filePath);
        results.push(packageInfo);
      } catch (error) {
        console.error(`Error parsing ${file.filePath}:`, error);
      }
    }

    return results.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  }

  private parseDependencySection(
    dependencies: Record<string, string>,
    type: PackageDependency["type"],
    targetArray: PackageDependency[],
    counts: Record<string, number>
  ): void {
    for (const [name, version] of Object.entries(dependencies)) {
      targetArray.push({
        name,
        version,
        type,
        ecosystem: "npm",
      });

      const countKey =
        type === "dependency"
          ? "dependencies"
          : type === "devDependency"
          ? "devDependencies"
          : type === "peerDependency"
          ? "peerDependencies"
          : "optionalDependencies";
      counts[countKey]++;
    }
  }
}
