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
        `[Packagist] Error fetching metadata for ${packageName}@${
          version || "latest"
        }:`,
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
      } else {
        // Check if the exact version exists
        if (!packageData.versions[targetVersion]) {
          // Try common variations
          const variations = [
            targetVersion,
            `v${targetVersion}`,
            targetVersion.replace(/^v/, ""),
            `${targetVersion}.0`, // Try adding .0 for versions like "12.0" -> "12.0.0"
            `${targetVersion}.0.0`, // Try adding .0.0 for versions like "12" -> "12.0.0"
          ];

          let foundVersion = null;
          for (const variant of variations) {
            if (packageData.versions[variant]) {
              foundVersion = variant;
              break;
            }
          }

          if (!foundVersion) {
            // Try to find a matching version using semver-like matching
            // For "12.0", find "12.0.x", for "7.5" find "7.5.x"
            const matchingVersion = versions.find((v) => {
              const cleanV = v.replace(/^v/, "");
              return cleanV.startsWith(targetVersion + ".");
            });

            if (matchingVersion) {
              foundVersion = matchingVersion;
            }
          }

          if (foundVersion) {
            targetVersion = foundVersion;
          } else {
            // Fall back to latest stable
            const latestStable =
              versions.find(
                (v) =>
                  !v.includes("dev") &&
                  !v.includes("master") &&
                  !v.includes("trunk")
              ) || versions[0];
            console.warn(
              `[Packagist] Version ${targetVersion} not found for ${packageName}, falling back to ${latestStable}`
            );
            targetVersion = latestStable;
          }
        }
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

      // Debug logging for license extraction
      if (hasUnknownLicense) {
        console.warn(
          `[Packagist] Package ${packageName}@${targetVersion} has unknown license. Raw license data:`,
          versionData.license
        );
      }

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

      // Get package size from dist URL
      // Use -1 to indicate size is unavailable (will be hidden in UI)
      let size = -1;
      if (versionData.dist?.url) {
        try {
          size = await this.fetchPackageSize(versionData.dist.url);
        } catch (error) {
          console.warn(
            `Could not fetch size for ${packageName}@${targetVersion}:`,
            error
          );
          // Size remains -1 if fetch fails
        }
      }

      return {
        name: packageData.name || packageName,
        version: targetVersion,
        license: license,
        lastUpdated: new Date(versionData.time),
        size: size,
        description: versionData.description || packageData.description || "",
        author: author,
        homepage: homepage,
        repository: repository,
        isOutdated: isOutdated,
        hasUnknownLicense: hasUnknownLicense,
      };
    } catch (error) {
      console.error(`Error in fetchFromPackagist for ${packageName}:`, error);
      throw new Error(`Failed to fetch Packagist metadata: ${error}`);
    }
  }

  /**
   * Attempts to fetch the package size from the distribution URL using HEAD request
   * Note: GitHub zipball URLs don't provide Content-Length headers
   * @param distUrl The URL to the package distribution (zipball/tarball)
   * @returns Size in bytes, or -1 if unable to fetch (indicating unavailable)
   */
  private async fetchPackageSize(distUrl: string): Promise<number> {
    try {
      const response = await fetch(distUrl, {
        method: "HEAD",
        headers: this.getDefaultHeaders(),
        redirect: "follow",
      });

      if (response.ok) {
        const contentLength = response.headers.get("Content-Length");
        if (contentLength && contentLength !== "0") {
          const size = parseInt(contentLength, 10);
          if (size > 0) {
            return size;
          }
        }
      }

      // GitHub URLs don't provide Content-Length, return -1 to indicate unavailable
      return -1;
    } catch (error) {
      console.warn(
        `[Packagist] Failed to fetch package size from ${distUrl}:`,
        error
      );
      return -1;
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
