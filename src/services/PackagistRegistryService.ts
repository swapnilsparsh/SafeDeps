import { PackageMetadata } from "../types";
import { BaseRegistryService } from "./BaseRegistryService";

export interface IPackagistRegistryService {
  fetchPackageMetadata(
    packageName: string,
    version?: string
  ): Promise<PackageMetadata>;
}

interface PackagistResponse {
  package: {
    name: string;
    description: string;
    time: string;
    maintainers: Array<{
      name: string;
      email?: string;
    }>;
    versions: Record<
      string,
      {
        name: string;
        description: string;
        keywords: string[];
        homepage?: string;
        version: string;
        version_normalized: string;
        license: string[];
        authors: Array<{
          name: string;
          email?: string;
          homepage?: string;
          role?: string;
        }>;
        source?: {
          url: string;
          type: string;
          reference: string;
        };
        dist: {
          url: string;
          type: string;
          reference: string;
          shasum?: string;
        };
        type: string;
        support?: {
          issues?: string;
          forum?: string;
          wiki?: string;
          irc?: string;
          source?: string;
          email?: string;
          rss?: string;
          chat?: string;
        };
        funding?: Array<{
          url: string;
          type: string;
        }>;
        time: string;
        autoload?: any;
        require?: Record<string, string>;
        "require-dev"?: Record<string, string>;
        conflict?: Record<string, string>;
        replace?: Record<string, string>;
        provide?: Record<string, string>;
        suggest?: Record<string, string>;
      }
    >;
    type: string;
    repository: string;
    github_stars?: number;
    github_watchers?: number;
    github_forks?: number;
    github_open_issues?: number;
    language?: string;
    dependents?: number;
    suggesters?: number;
    downloads: {
      total: number;
      monthly: number;
      daily: number;
    };
    favers?: number;
  };
}

export class PackagistRegistryService
  extends BaseRegistryService
  implements IPackagistRegistryService
{
  private readonly PACKAGIST_API_URL = "https://packagist.org/packages";

  public getEcosystem(): string {
    return "Packagist";
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
      const metadata = await this.fetchFromPackagist(packageName, version);
      this.cache.set(cacheKey, metadata);
      return metadata;
    } catch (error) {
      console.error(
        `Error fetching Packagist metadata for ${packageName}:`,
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

  private async fetchFromPackagist(
    packageName: string,
    version?: string
  ): Promise<PackageMetadata> {
    try {
      const url = `${this.PACKAGIST_API_URL}/${encodeURIComponent(
        packageName
      )}.json`;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Package not found: ${packageName}`);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as PackagistResponse;
      const packageData = data.package;

      // Get versions sorted by version number (latest first)
      const versions = Object.keys(packageData.versions).sort((a, b) => {
        return this.compareVersions(b, a); // Reverse order for latest first
      });

      if (versions.length === 0) {
        throw new Error(`No versions found for package: ${packageName}`);
      }

      // Determine target version
      let targetVersion = version;
      if (!targetVersion || targetVersion === "latest") {
        // Find the latest stable version (not dev-master or similar)
        targetVersion =
          versions.find(
            (v) =>
              !v.includes("dev") &&
              !v.includes("master") &&
              !v.includes("trunk")
          ) || versions[0];
      }

      const versionData = packageData.versions[targetVersion];
      if (!versionData) {
        throw new Error(
          `Version ${targetVersion} not found for package: ${packageName}`
        );
      }

      // Check if outdated
      const latestStableVersion =
        versions.find(
          (v) =>
            !v.includes("dev") && !v.includes("master") && !v.includes("trunk")
        ) || versions[0];

      const isOutdated =
        version && version !== "latest"
          ? this.compareVersions(version, latestStableVersion) < 0
          : false;

      // Extract license information
      const licenses = versionData.license || [];
      const license = licenses.length > 0 ? licenses.join(", ") : "Unknown";
      const hasUnknownLicense =
        licenses.length === 0 ||
        license === "Unknown" ||
        license.toLowerCase().includes("unknown");

      // Get author information
      const authors = versionData.authors || [];
      const author =
        authors.length > 0 ? authors.map((a) => a.name).join(", ") : "";

      // Get repository URL
      const repository =
        versionData.source?.url || versionData.support?.source || "";

      // Get homepage
      const homepage =
        versionData.homepage || `https://packagist.org/packages/${packageName}`;

      return {
        name: packageData.name || packageName,
        version: targetVersion,
        license: license,
        lastUpdated: new Date(versionData.time),
        size: 0, // Size not provided by Packagist API
        description: versionData.description || packageData.description || "",
        author: author,
        homepage: homepage,
        repository: repository,
        isOutdated: isOutdated,
        hasUnknownLicense: hasUnknownLicense,
      };
    } catch (error) {
      throw new Error(`Failed to fetch Packagist metadata: ${error}`);
    }
  }

  private compareVersions(version1: string, version2: string): number {
    // Handle PHP/Composer version comparison (semantic versioning with additional formats)

    // Remove common prefixes
    const cleanV1 = version1.replace(/^v/, "").replace(/^dev-/, "");
    const cleanV2 = version2.replace(/^v/, "").replace(/^dev-/, "");

    // Handle special cases
    if (cleanV1.includes("dev") && !cleanV2.includes("dev")) {
      return -1;
    }
    if (!cleanV1.includes("dev") && cleanV2.includes("dev")) {
      return 1;
    }

    const parts1 = cleanV1.split(/[\.\-]/).map((part) => {
      const num = parseInt(part.replace(/[^\d]/g, ""), 10);
      return isNaN(num) ? 0 : num;
    });
    const parts2 = cleanV2.split(/[\.\-]/).map((part) => {
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
