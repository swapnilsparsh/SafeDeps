import { PackageMetadata } from "../types";
import { IBaseRegistryService } from "./BaseRegistryService";
import { NpmRegistryService } from "./NpmRegistryService";
import { PyPIRegistryService } from "./PyPIRegistryService";
import { GoRegistryService } from "./GoRegistryService";
import { CratesRegistryService } from "./CratesRegistryService";
import { MavenRegistryService } from "./MavenRegistryService";
import { RubyGemsRegistryService } from "./RubyGemsRegistryService";
import { PackagistRegistryService } from "./PackagistRegistryService";

export interface IUnifiedRegistryService {
  fetchPackageMetadata(
    packageName: string,
    ecosystem: string,
    version?: string
  ): Promise<PackageMetadata>;
  fetchMultiplePackageMetadata(
    packages: { name: string; ecosystem: string; version?: string }[],
    onProgress?: (
      current: number,
      total: number,
      packageName?: string,
      ecosystem?: string
    ) => void
  ): Promise<Map<string, PackageMetadata>>;
  getSupportedEcosystems(): string[];
}

export class UnifiedRegistryService implements IUnifiedRegistryService {
  private registryServices: Map<string, IBaseRegistryService>;

  constructor() {
    this.registryServices = new Map();

    // Initialize all registry services
    this.registryServices.set("npm", new NpmRegistryService());
    this.registryServices.set("PyPI", new PyPIRegistryService());
    this.registryServices.set("Go", new GoRegistryService());
    this.registryServices.set("crates.io", new CratesRegistryService());
    this.registryServices.set("Maven", new MavenRegistryService());
    this.registryServices.set("RubyGems", new RubyGemsRegistryService());
    this.registryServices.set("Packagist", new PackagistRegistryService());

    // Add aliases for common ecosystem names
    this.registryServices.set("javascript", this.registryServices.get("npm")!);
    this.registryServices.set("typescript", this.registryServices.get("npm")!);
    this.registryServices.set("python", this.registryServices.get("PyPI")!);
    this.registryServices.set("pypi", this.registryServices.get("PyPI")!);
    this.registryServices.set("go", this.registryServices.get("Go")!);
    this.registryServices.set("golang", this.registryServices.get("Go")!);
    this.registryServices.set("rust", this.registryServices.get("crates.io")!);
    this.registryServices.set(
      "crates",
      this.registryServices.get("crates.io")!
    );
    this.registryServices.set("java", this.registryServices.get("Maven")!);
    this.registryServices.set("maven", this.registryServices.get("Maven")!);
    this.registryServices.set("ruby", this.registryServices.get("RubyGems")!);
    this.registryServices.set(
      "rubygems",
      this.registryServices.get("RubyGems")!
    );
    this.registryServices.set("php", this.registryServices.get("Packagist")!);
    this.registryServices.set(
      "packagist",
      this.registryServices.get("Packagist")!
    );
    this.registryServices.set(
      "composer",
      this.registryServices.get("Packagist")!
    );
  }

  public async fetchPackageMetadata(
    packageName: string,
    ecosystem: string,
    version?: string
  ): Promise<PackageMetadata> {
    const normalizedEcosystem = ecosystem.toLowerCase();
    const service = this.registryServices.get(normalizedEcosystem);

    if (!service) {
      console.warn(`No registry service available for ecosystem: ${ecosystem}`);
      return this.createDefaultMetadata(
        packageName,
        version || "latest",
        ecosystem
      );
    }

    try {
      return await service.fetchPackageMetadata(packageName, version);
    } catch (error) {
      console.error(
        `Error fetching metadata for ${packageName} from ${ecosystem}:`,
        error
      );
      return this.createDefaultMetadata(
        packageName,
        version || "latest",
        ecosystem
      );
    }
  }

  public async fetchMultiplePackageMetadata(
    packages: { name: string; ecosystem: string; version?: string }[],
    onProgress?: (
      current: number,
      total: number,
      packageName?: string,
      ecosystem?: string
    ) => void
  ): Promise<Map<string, PackageMetadata>> {
    const results = new Map<string, PackageMetadata>();
    const totalPackages = packages.length;
    let processedPackages = 0;

    // Group packages by ecosystem for batch processing
    const packagesByEcosystem = new Map<
      string,
      Array<{ name: string; version?: string }>
    >();

    for (const pkg of packages) {
      const normalizedEcosystem = pkg.ecosystem.toLowerCase();
      if (!packagesByEcosystem.has(normalizedEcosystem)) {
        packagesByEcosystem.set(normalizedEcosystem, []);
      }
      packagesByEcosystem.get(normalizedEcosystem)!.push({
        name: pkg.name,
        version: pkg.version,
      });
    }

    // Process each ecosystem in parallel
    const fetchPromises = Array.from(packagesByEcosystem.entries()).map(
      async ([ecosystem, ecosystemPackages]) => {
        const service = this.registryServices.get(ecosystem);

        if (!service) {
          console.warn(
            `No registry service available for ecosystem: ${ecosystem}`
          );
          // Add default metadata for packages in unsupported ecosystems
          for (const pkg of ecosystemPackages) {
            results.set(
              pkg.name,
              this.createDefaultMetadata(
                pkg.name,
                pkg.version || "latest",
                ecosystem
              )
            );
            processedPackages++;
            if (onProgress) {
              onProgress(processedPackages, totalPackages, pkg.name, ecosystem);
            }
          }
          return;
        }

        try {
          const ecosystemResults = await service.fetchMultiplePackageMetadata(
            ecosystemPackages
          );
          for (const [name, metadata] of ecosystemResults) {
            results.set(name, metadata);
            processedPackages++;
            if (onProgress) {
              onProgress(processedPackages, totalPackages, name, ecosystem);
            }
          }
        } catch (error) {
          console.error(
            `Error fetching metadata for ${ecosystem} packages:`,
            error
          );
          // Add default metadata for failed packages
          for (const pkg of ecosystemPackages) {
            results.set(
              pkg.name,
              this.createDefaultMetadata(
                pkg.name,
                pkg.version || "latest",
                ecosystem
              )
            );
            processedPackages++;
            if (onProgress) {
              onProgress(processedPackages, totalPackages, pkg.name, ecosystem);
            }
          }
        }
      }
    );

    await Promise.all(fetchPromises);
    return results;
  }

  public getSupportedEcosystems(): string[] {
    return Array.from(
      new Set(
        Array.from(this.registryServices.keys()).filter((key) =>
          // Filter out aliases, keep only main ecosystem names
          [
            "npm",
            "PyPI",
            "Go",
            "crates.io",
            "Maven",
            "RubyGems",
            "Packagist",
          ].includes(key)
        )
      )
    );
  }

  public addRegistryService(
    ecosystem: string,
    service: IBaseRegistryService
  ): void {
    this.registryServices.set(ecosystem.toLowerCase(), service);
  }

  private createDefaultMetadata(
    name: string,
    version: string,
    ecosystem: string
  ): PackageMetadata {
    return {
      name,
      version,
      license: "Unknown",
      lastUpdated: new Date(),
      size: 0,
      description: "",
      author: "",
      homepage: "",
      repository: "",
      isOutdated: false,
      hasUnknownLicense: true,
    };
  }
}
