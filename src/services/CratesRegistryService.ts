import { PackageMetadata } from "../types";
import { BaseRegistryService } from "./BaseRegistryService";

export interface ICratesRegistryService {
  fetchPackageMetadata(
    packageName: string,
    version?: string
  ): Promise<PackageMetadata>;
}

interface CratesResponse {
  crate: {
    id: string;
    name: string;
    description?: string;
    homepage?: string;
    repository?: string;
    max_version: string;
    newest_version: string;
    created_at: string;
    updated_at: string;
  };
  versions: Array<{
    id: number;
    crate: string;
    num: string;
    created_at: string;
    updated_at: string;
    license?: string;
    crate_size?: number;
    published_by?: {
      login: string;
      name?: string;
    };
  }>;
}

export class CratesRegistryService
  extends BaseRegistryService
  implements ICratesRegistryService
{
  private readonly CRATES_API_URL = "https://crates.io/api/v1";
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

  public getEcosystem(): string {
    return "crates.io";
  }

  private async rateLimitedRequest(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      const delay = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    this.lastRequestTime = Date.now();
  }

  public async fetchPackageMetadata(
    packageName: string,
    version?: string
  ): Promise<PackageMetadata> {
    const cacheKey = this.getCacheKey(packageName, version);

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // Apply rate limiting to respect crates.io API limits
      await this.rateLimitedRequest();

      const url = `${this.CRATES_API_URL}/crates/${encodeURIComponent(
        packageName
      )}`;

      try {
        // Use the base class method for consistent request handling
        const response = await this.makeRequest(url);

        if (!response.ok) {
          if (response.status === 404) {
            console.warn(`Package ${packageName} not found on crates.io`);
            const defaultMetadata = this.createDefaultMetadata(
              packageName,
              version || "latest"
            );
            this.cache.set(cacheKey, defaultMetadata);
            return defaultMetadata;
          }

          if (response.status === 403) {
            console.warn(
              `Access forbidden for package ${packageName}. This might be due to rate limiting or API access restrictions.`
            );
            console.info(
              `Crates.io API Response Headers:`,
              Object.fromEntries(response.headers.entries())
            );
            const defaultMetadata = this.createDefaultMetadata(
              packageName,
              version || "latest"
            );
            this.cache.set(cacheKey, defaultMetadata);
            return defaultMetadata;
          }

          if (response.status === 429) {
            console.warn(
              `Rate limited by crates.io API for package ${packageName}. Using cached/default data.`
            );
            const defaultMetadata = this.createDefaultMetadata(
              packageName,
              version || "latest"
            );
            this.cache.set(cacheKey, defaultMetadata);
            return defaultMetadata;
          }

          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = (await response.json()) as CratesResponse;
        const metadata = this.mapCratesResponseToMetadata(
          data,
          packageName,
          version
        );

        this.cache.set(cacheKey, metadata);
        return metadata;
      } catch (error) {
        throw error;
      }
    } catch (error) {
      this.handleApiError(error, packageName, "fetching crates.io metadata");

      const defaultMetadata = this.createDefaultMetadata(
        packageName,
        version || "latest"
      );
      this.cache.set(cacheKey, defaultMetadata);
      return defaultMetadata;
    }
  }

  public async fetchMultiplePackageMetadata(
    packages: { name: string; version?: string }[]
  ): Promise<Map<string, PackageMetadata>> {
    const results = new Map<string, PackageMetadata>();

    // Process packages in smaller batches to avoid overwhelming the API
    const batchSize = 5;
    const batches = [];

    for (let i = 0; i < packages.length; i += batchSize) {
      batches.push(packages.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const batchPromises = batch.map(async (pkg) => {
        try {
          const metadata = await this.fetchPackageMetadata(
            pkg.name,
            pkg.version
          );
          results.set(pkg.name, metadata);
        } catch (error) {
          console.error(
            `[Crates] Failed to fetch metadata for ${pkg.name}:`,
            error
          );
          // Add default metadata for failed packages
          const defaultMetadata = this.createDefaultMetadata(
            pkg.name,
            pkg.version || "latest"
          );
          results.set(pkg.name, defaultMetadata);
        }
      });

      // Wait for current batch to complete before starting next batch
      await Promise.all(batchPromises);

      // Add a small delay between batches
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return results;
  }

  private mapCratesResponseToMetadata(
    data: CratesResponse,
    requestedName: string,
    requestedVersion?: string
  ): PackageMetadata {
    const crate = data.crate;
    const latestVersion = crate.newest_version || crate.max_version;
    const targetVersion = requestedVersion || latestVersion;

    // Find the specific version data
    let versionData = data.versions.find((v) => v.num === targetVersion);
    if (!versionData && data.versions.length > 0) {
      // Fall back to the first version (usually the latest)
      versionData = data.versions[0];
    }

    // Check if package is outdated
    const isOutdated = requestedVersion
      ? this.compareVersions(requestedVersion, latestVersion) < 0
      : false;

    // Get metadata from version or crate
    const license = versionData?.license || "Unknown";
    const hasUnknownLicense =
      !license ||
      license === "Unknown" ||
      license.trim() === "" ||
      license.toLowerCase().includes("unknown");

    const lastUpdated = versionData
      ? new Date(versionData.updated_at || versionData.created_at)
      : new Date(crate.updated_at || crate.created_at);

    const author =
      versionData?.published_by?.name || versionData?.published_by?.login || "";

    return {
      name: crate.name || requestedName,
      version: targetVersion,
      license: license,
      lastUpdated: lastUpdated,
      size: versionData?.crate_size || -1,
      description: crate.description || "",
      author: author,
      homepage: crate.homepage || "",
      repository: crate.repository || "",
      isOutdated: isOutdated,
      hasUnknownLicense: hasUnknownLicense,
    };
  }

  private compareVersions(version1: string, version2: string): number {
    // Handle semantic versioning for Rust crates
    const parts1 = version1.split(".").map((part) => {
      const num = parseInt(part.replace(/[^\d]/g, ""), 10);
      return isNaN(num) ? 0 : num;
    });
    const parts2 = version2.split(".").map((part) => {
      const num = parseInt(part.replace(/[^\d]/g, ""), 10);
      return isNaN(num) ? 0 : num;
    });

    const maxLength = Math.max(parts1.length, parts2.length);

    for (let i = 0; i < maxLength; i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;

      if (part1 < part2) {
        return -1;
      }
      if (part1 > part2) {
        return 1;
      }
    }

    return 0;
  }
}
