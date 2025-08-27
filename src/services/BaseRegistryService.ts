import { PackageMetadata } from "../types";

export interface IBaseRegistryService {
  fetchPackageMetadata(
    packageName: string,
    version?: string
  ): Promise<PackageMetadata>;
  fetchMultiplePackageMetadata(
    packages: { name: string; version?: string }[]
  ): Promise<Map<string, PackageMetadata>>;
  getEcosystem(): string;
}

export abstract class BaseRegistryService implements IBaseRegistryService {
  protected cache = new Map<string, PackageMetadata>();

  abstract fetchPackageMetadata(
    packageName: string,
    version?: string
  ): Promise<PackageMetadata>;

  abstract getEcosystem(): string;

  public async fetchMultiplePackageMetadata(
    packages: { name: string; version?: string }[]
  ): Promise<Map<string, PackageMetadata>> {
    const results = new Map<string, PackageMetadata>();
    const fetchPromises = packages.map(async (pkg) => {
      try {
        const metadata = await this.fetchPackageMetadata(pkg.name, pkg.version);
        results.set(pkg.name, metadata);
      } catch (error) {
        console.error(`Failed to fetch metadata for ${pkg.name}:`, error);
      }
    });

    await Promise.all(fetchPromises);
    return results;
  }

  protected createDefaultMetadata(
    name: string,
    version: string
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

  protected getCacheKey(packageName: string, version?: string): string {
    return `${packageName}@${version || "latest"}`;
  }
}
