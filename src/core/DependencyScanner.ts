import { PackageJsonSummary } from "../types";
import { BaseDependencyScanner } from "./BaseDependencyScanner";
import { PackageJsonParser } from "../parsers/PackageJsonParser";

export class DependencyScanner extends BaseDependencyScanner {
  private packageJsonParser: PackageJsonParser;

  constructor() {
    super();
    this.packageJsonParser = new PackageJsonParser();
  }

  public async parseAllPackageJsonFiles() {
    const packageJsonFiles = await this.scanForFileType("package.json");
    return this.packageJsonParser.parseAllPackageJsonFiles(packageJsonFiles);
  }

  public async getPackageJsonSummary(): Promise<PackageJsonSummary> {
    const packages = await this.parseAllPackageJsonFiles();
    const dependencyBreakdown = {
      dependencies: 0,
      devDependencies: 0,
      peerDependencies: 0,
      optionalDependencies: 0,
    };

    const allDependencies: {
      packageFile: string;
      dependency: import("../types").PackageDependency;
    }[] = [];
    let totalDependencies = 0;

    for (const pkg of packages) {
      totalDependencies += pkg.totalDependencies;
      dependencyBreakdown.dependencies += pkg.dependencyCounts.dependencies;
      dependencyBreakdown.devDependencies +=
        pkg.dependencyCounts.devDependencies;
      dependencyBreakdown.peerDependencies +=
        pkg.dependencyCounts.peerDependencies;
      dependencyBreakdown.optionalDependencies +=
        pkg.dependencyCounts.optionalDependencies;

      for (const dep of pkg.dependencies) {
        allDependencies.push({
          packageFile: pkg.relativePath,
          dependency: dep,
        });
      }
    }

    return {
      totalPackageFiles: packages.length,
      totalDependencies,
      dependencyBreakdown,
      packages,
      allDependencies,
    };
  }
}
