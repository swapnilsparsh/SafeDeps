import { PackageJsonSummary, PackageJsonSummaryWithMetadata } from "../types";
import { BaseDependencyScanner } from "./BaseDependencyScanner";
import { PackageJsonParser } from "../parsers/PackageJsonParser";
import { NpmRegistryService } from "../services/NpmRegistryService";

export class DependencyScanner extends BaseDependencyScanner {
  private packageJsonParser: PackageJsonParser;
  private npmRegistryService: NpmRegistryService;

  constructor() {
    super();
    this.packageJsonParser = new PackageJsonParser();
    this.npmRegistryService = new NpmRegistryService();
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

  public async getPackageJsonSummaryWithMetadata(): Promise<PackageJsonSummaryWithMetadata> {
    const packages = await this.parseAllPackageJsonFiles();
    const dependencyBreakdown = {
      dependencies: 0,
      devDependencies: 0,
      peerDependencies: 0,
      optionalDependencies: 0,
    };

    const allDependencies: {
      packageFile: string;
      dependency: import("../types").PackageDependencyWithMetadata;
    }[] = [];
    let totalDependencies = 0;
    let outdatedPackages = 0;
    let unknownLicensePackages = 0;

    const uniquePackages = new Map<
      string,
      { name: string; version?: string }
    >();

    for (const pkg of packages) {
      for (const dep of pkg.dependencies) {
        if (!uniquePackages.has(dep.name)) {
          uniquePackages.set(dep.name, {
            name: dep.name,
            version: dep.version,
          });
        }
      }
    }

    const metadataMap =
      await this.npmRegistryService.fetchMultiplePackageMetadata(
        Array.from(uniquePackages.values())
      );

    const packagesWithMetadata = packages.map((pkg) => {
      const dependenciesWithMetadata = pkg.dependencies.map((dep) => {
        const metadata = metadataMap.get(dep.name);
        if (metadata) {
          if (metadata.isOutdated) {
            outdatedPackages++;
          }
          if (metadata.hasUnknownLicense) {
            unknownLicensePackages++;
          }
        }

        return {
          ...dep,
          metadata,
        };
      });

      totalDependencies += pkg.totalDependencies;
      dependencyBreakdown.dependencies += pkg.dependencyCounts.dependencies;
      dependencyBreakdown.devDependencies +=
        pkg.dependencyCounts.devDependencies;
      dependencyBreakdown.peerDependencies +=
        pkg.dependencyCounts.peerDependencies;
      dependencyBreakdown.optionalDependencies +=
        pkg.dependencyCounts.optionalDependencies;

      for (const dep of dependenciesWithMetadata) {
        allDependencies.push({
          packageFile: pkg.relativePath,
          dependency: dep,
        });
      }

      return {
        ...pkg,
        dependencies: dependenciesWithMetadata,
      };
    });

    return {
      totalPackageFiles: packages.length,
      totalDependencies,
      dependencyBreakdown,
      packages: packagesWithMetadata,
      allDependencies,
      outdatedPackages,
      unknownLicensePackages,
    };
  }
}
