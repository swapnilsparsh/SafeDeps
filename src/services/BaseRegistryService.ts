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

  protected getDefaultHeaders(): Record<string, string> {
    return {
      "User-Agent":
        "SafeDeps VSCode Extension (https://github.com/swapnilsparsh/SafeDeps)",
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
    };
  }

  protected async makeRequest(
    url: string,
    options?: RequestInit
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.getDefaultHeaders(),
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  protected handleApiError(
    error: any,
    packageName: string,
    operation: string
  ): void {
    if (error instanceof Error && error.name === "AbortError") {
      console.error(
        `Request timeout for ${operation} for package ${packageName}`
      );
    } else if (error instanceof Error) {
      console.error(
        `Error during ${operation} for package ${packageName}:`,
        error.message
      );
    } else {
      console.error(
        `Unknown error during ${operation} for package ${packageName}:`,
        error
      );
    }
  }
}
