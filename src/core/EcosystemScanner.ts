import {
  DependencyFile,
  PackageDependency,
  DependencyEcosystem,
} from "../types";
import { BaseDependencyScanner } from "./BaseDependencyScanner";
import { UnifiedDependencyParser } from "../parsers/UnifiedDependencyParser";
import { UnifiedRegistryService } from "../services/UnifiedRegistryService";
import { OsvService } from "../services/OsvService";

export interface EcosystemScanResult {
  ecosystem: DependencyEcosystem;
  totalFiles: number;
  totalDependencies: number;
  files: {
    file: DependencyFile;
    dependencies: (PackageDependency & {
      vulnerabilities?: any[];
      metadata?: any;
    })[];
  }[];
  vulnerablePackages: number;
  outdatedPackages: number;
  unknownLicensePackages: number;
  vulnerabilityBreakdown: {
    low: number;
    medium: number;
    high: number;
    critical: number;
    unknown: number;
  };
}

export class EcosystemScanner extends BaseDependencyScanner {
  private unifiedParser: UnifiedDependencyParser;
  private unifiedRegistryService: UnifiedRegistryService;
  private osvService: OsvService;

  constructor() {
    super();
    this.unifiedParser = new UnifiedDependencyParser();
    this.unifiedRegistryService = new UnifiedRegistryService();
    this.osvService = new OsvService();
  }

  public getSupportedEcosystems(): DependencyEcosystem[] {
    return ["npm", "PyPI", "Maven", "Go", "crates.io", "RubyGems", "Packagist"];
  }

  public async scanEcosystem(
    ecosystem: DependencyEcosystem
  ): Promise<EcosystemScanResult> {
    const allFiles = await this.scanWorkspace();
    const ecosystemFiles = allFiles.filter(
      (file) => file.ecosystem === ecosystem
    );

    if (ecosystemFiles.length === 0) {
      return this.createEmptyResult(ecosystem);
    }

    const filesWithDependencies: {
      file: DependencyFile;
      dependencies: PackageDependency[];
    }[] = [];

    // Parse dependencies for each file
    for (const file of ecosystemFiles) {
      try {
        const dependencies = await this.unifiedParser.parseFile(file);
        filesWithDependencies.push({
          file,
          dependencies,
        });
      } catch (error) {
        console.error(`Error parsing ${file.filePath}:`, error);
        filesWithDependencies.push({
          file,
          dependencies: [],
        });
      }
    }

    // Collect unique packages for metadata and vulnerability checking
    const uniquePackages = new Map<
      string,
      { name: string; version: string; ecosystem: string }
    >();
    let totalDependencies = 0;

    for (const fileData of filesWithDependencies) {
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
      }
    }

    // Fetch metadata and vulnerabilities
    const metadataMap =
      await this.unifiedRegistryService.fetchMultiplePackageMetadata(
        Array.from(uniquePackages.values())
      );

    const vulnerabilityMap = await this.osvService.checkMultipleVulnerabilities(
      Array.from(uniquePackages.values())
    );

    // Process results and add metadata
    let vulnerablePackages = 0;
    let outdatedPackages = 0;
    let unknownLicensePackages = 0;
    const vulnerabilityBreakdown = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
      unknown: 0,
    };

    const filesWithMetadata = filesWithDependencies.map((fileData) => {
      const dependenciesWithMetadata = fileData.dependencies.map((dep) => {
        const vulnerabilities = vulnerabilityMap.get(dep.name) || [];
        const metadata = metadataMap.get(dep.name);

        if (vulnerabilities.length > 0) {
          vulnerablePackages++;
          vulnerabilities.forEach((vuln) => {
            vulnerabilityBreakdown[
              vuln.severity.toLowerCase() as keyof typeof vulnerabilityBreakdown
            ]++;
          });
        }

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
          vulnerabilities,
          metadata,
        };
      });

      return {
        ...fileData,
        dependencies: dependenciesWithMetadata,
      };
    });

    return {
      ecosystem,
      totalFiles: ecosystemFiles.length,
      totalDependencies,
      files: filesWithMetadata,
      vulnerablePackages,
      outdatedPackages,
      unknownLicensePackages,
      vulnerabilityBreakdown,
    };
  }

  private createEmptyResult(
    ecosystem: DependencyEcosystem
  ): EcosystemScanResult {
    return {
      ecosystem,
      totalFiles: 0,
      totalDependencies: 0,
      files: [],
      vulnerablePackages: 0,
      outdatedPackages: 0,
      unknownLicensePackages: 0,
      vulnerabilityBreakdown: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
        unknown: 0,
      },
    };
  }
}
