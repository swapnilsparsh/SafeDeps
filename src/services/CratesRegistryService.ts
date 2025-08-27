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

  public getEcosystem(): string {
    return "crates.io";
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
      const url = `${this.CRATES_API_URL}/crates/${encodeURIComponent(
        packageName
      )}`;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
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
      console.error(
        `Error fetching crates.io metadata for ${packageName}:`,
        error
      );
      const defaultMetadata = this.createDefaultMetadata(
        packageName,
        version || "latest"
      );
      this.cache.set(cacheKey, defaultMetadata);
      return defaultMetadata;
    }
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
      size: versionData?.crate_size || 0,
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
