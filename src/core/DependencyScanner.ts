import { PackageJsonSummary, PackageJsonSummaryWithMetadata } from "../types";
import { BaseDependencyScanner } from "./BaseDependencyScanner";
import { PackageJsonParser } from "../parsers/PackageJsonParser";
import { UnifiedDependencyParser } from "../parsers/UnifiedDependencyParser";
import { NpmRegistryService } from "../services/NpmRegistryService";
import { OsvService } from "../services/OsvService";

export class DependencyScanner extends BaseDependencyScanner {
  private packageJsonParser: PackageJsonParser;
  private unifiedParser: UnifiedDependencyParser;
  private npmRegistryService: NpmRegistryService;
  private osvService: OsvService;

  constructor() {
    super();
    this.packageJsonParser = new PackageJsonParser();
    this.unifiedParser = new UnifiedDependencyParser();
    this.npmRegistryService = new NpmRegistryService();
    this.osvService = new OsvService();
  }

  public async parseAllPackageJsonFiles() {
    const packageJsonFiles = await this.scanForFileType("package.json");
    return this.packageJsonParser.parseAllPackageJsonFiles(packageJsonFiles);
  }

  public async parseAllDependencyFiles() {
    const allFiles = await this.scanWorkspace();
    const allDependencies: {
      file: import("../types").DependencyFile;
      dependencies: import("../types").PackageDependency[];
    }[] = [];

    for (const file of allFiles) {
      try {
        const dependencies = await this.unifiedParser.parseFile(file);
        allDependencies.push({
          file,
          dependencies,
        });
      } catch (error) {
        console.error(`Error parsing ${file.filePath}:`, error);
        allDependencies.push({
          file,
          dependencies: [],
        });
      }
    }

    return allDependencies;
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
    let vulnerablePackages = 0;
    const vulnerabilityBreakdown = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
      unknown: 0,
    };

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

    const npmPackages = Array.from(uniquePackages.values()).map((pkg) => ({
      name: pkg.name,
      version: pkg.version || "latest",
      ecosystem: "npm",
    }));

    const vulnerabilityMap = await this.osvService.checkMultipleVulnerabilities(
      npmPackages
    );

    const packagesWithMetadata = packages.map((pkg) => {
      const dependenciesWithMetadata = pkg.dependencies.map((dep) => {
        const metadata = metadataMap.get(dep.name);
        const vulnerabilities = vulnerabilityMap.get(dep.name) || [];

        if (metadata) {
          if (metadata.isOutdated) {
            outdatedPackages++;
          }
          if (metadata.hasUnknownLicense) {
            unknownLicensePackages++;
          }

          metadata.vulnerabilities = vulnerabilities;
          metadata.hasVulnerabilities = vulnerabilities.length > 0;
          metadata.vulnerabilityCount = vulnerabilities.length;

          if (vulnerabilities.length > 0) {
            vulnerablePackages++;

            let highestSeverity:
              | "LOW"
              | "MEDIUM"
              | "HIGH"
              | "CRITICAL"
              | "UNKNOWN" = "UNKNOWN";
            vulnerabilities.forEach((vuln) => {
              vulnerabilityBreakdown[
                vuln.severity.toLowerCase() as keyof typeof vulnerabilityBreakdown
              ]++;

              const severityOrder = {
                UNKNOWN: 0,
                LOW: 1,
                MEDIUM: 2,
                HIGH: 3,
                CRITICAL: 4,
              };
              if (
                severityOrder[vuln.severity] > severityOrder[highestSeverity]
              ) {
                highestSeverity = vuln.severity;
              }
            });
            metadata.highestSeverity =
              highestSeverity !== "UNKNOWN" ? highestSeverity : undefined;
          }
        }

        const dependencyWithMetadata = {
          ...dep,
          metadata,
          vulnerabilities,
        };

        return dependencyWithMetadata;
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
      vulnerablePackages,
      vulnerabilityBreakdown,
    };
  }

  public async getUnifiedDependencySummaryWithVulnerabilities() {
    const allFiles = await this.parseAllDependencyFiles();
    let totalDependencies = 0;
    let vulnerablePackages = 0;
    const ecosystemBreakdown: Record<string, number> = {};
    const vulnerabilityBreakdown = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
      unknown: 0,
    };

    const uniquePackages = new Map<
      string,
      { name: string; version: string; ecosystem: string }
    >();
    const allDependencies: {
      file: import("../types").DependencyFile;
      dependency: import("../types").PackageDependency;
    }[] = [];

    for (const fileData of allFiles) {
      for (const dep of fileData.dependencies) {
        const key = `${dep.ecosystem}:${dep.name}`;
        if (!uniquePackages.has(key)) {
          uniquePackages.set(key, {
            name: dep.name,
            version: dep.version,
            ecosystem: dep.ecosystem,
          });
        }

        totalDependencies++;
        ecosystemBreakdown[dep.ecosystem] =
          (ecosystemBreakdown[dep.ecosystem] || 0) + 1;

        allDependencies.push({
          file: fileData.file,
          dependency: dep,
        });
      }
    }

    const vulnerabilityMap = await this.osvService.checkMultipleVulnerabilities(
      Array.from(uniquePackages.values())
    );

    const filesWithVulnerabilities = allFiles.map((fileData) => {
      const dependenciesWithVulnerabilities = fileData.dependencies.map(
        (dep) => {
          const vulnerabilities = vulnerabilityMap.get(dep.name) || [];

          if (vulnerabilities.length > 0) {
            vulnerablePackages++;

            vulnerabilities.forEach((vuln) => {
              vulnerabilityBreakdown[
                vuln.severity.toLowerCase() as keyof typeof vulnerabilityBreakdown
              ]++;
            });
          }

          return {
            ...dep,
            vulnerabilities,
          };
        }
      );

      return {
        ...fileData,
        dependencies: dependenciesWithVulnerabilities,
      };
    });

    return {
      totalFiles: allFiles.length,
      totalDependencies,
      ecosystemBreakdown,
      vulnerablePackages,
      vulnerabilityBreakdown,
      files: filesWithVulnerabilities,
      allDependencies: allDependencies.map((item) => ({
        file: item.file,
        dependency: {
          ...item.dependency,
          vulnerabilities: vulnerabilityMap.get(item.dependency.name) || [],
        },
      })),
    };
  }
}
