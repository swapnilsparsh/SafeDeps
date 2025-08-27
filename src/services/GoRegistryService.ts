import { PackageMetadata } from "../types";
import { BaseRegistryService } from "./BaseRegistryService";

export interface IGoRegistryService {
  fetchPackageMetadata(
    packageName: string,
    version?: string
  ): Promise<PackageMetadata>;
}

interface GoProxyResponse {
  Version: string;
  Time: string;
}

interface GoModuleInfo {
  Version: string;
  Time: string;
  Origin?: {
    VCS: string;
    URL: string;
    Subdir?: string;
    Ref?: string;
  };
}

export class GoRegistryService
  extends BaseRegistryService
  implements IGoRegistryService
{
  private readonly GO_PROXY_URL = "https://proxy.golang.org";
  private readonly GO_MOD_URL = "https://pkg.go.dev";

  public getEcosystem(): string {
    return "Go";
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
      const metadata = await this.fetchFromGoProxy(packageName, version);
      this.cache.set(cacheKey, metadata);
      return metadata;
    } catch (error) {
      console.error(`Error fetching Go metadata for ${packageName}:`, error);
      const defaultMetadata = this.createDefaultMetadata(
        packageName,
        version || "latest"
      );
      this.cache.set(cacheKey, defaultMetadata);
      return defaultMetadata;
    }
  }

  private async fetchFromGoProxy(
    packageName: string,
    version?: string
  ): Promise<PackageMetadata> {
    try {
      // First, get the latest version if not specified
      let targetVersion = version;
      if (!targetVersion || targetVersion === "latest") {
        const latestUrl = `${this.GO_PROXY_URL}/${encodeURIComponent(
          packageName
        )}/@latest`;
        const latestResponse = await fetch(latestUrl);
        if (latestResponse.ok) {
          const latestData = (await latestResponse.json()) as GoProxyResponse;
          targetVersion = latestData.Version;
        } else {
          targetVersion = "v0.0.0";
        }
      }

      // Get version info
      const versionUrl = `${this.GO_PROXY_URL}/${encodeURIComponent(
        packageName
      )}/@v/${encodeURIComponent(targetVersion)}.info`;
      const versionResponse = await fetch(versionUrl);

      let lastUpdated = new Date();
      let isOutdated = false;

      if (versionResponse.ok) {
        const versionData = (await versionResponse.json()) as GoModuleInfo;
        lastUpdated = new Date(versionData.Time);

        // Check if outdated by comparing with latest
        if (version && version !== "latest") {
          try {
            const latestUrl = `${this.GO_PROXY_URL}/${encodeURIComponent(
              packageName
            )}/@latest`;
            const latestResponse = await fetch(latestUrl);
            if (latestResponse.ok) {
              const latestData =
                (await latestResponse.json()) as GoProxyResponse;
              isOutdated =
                this.compareVersions(version, latestData.Version) < 0;
            }
          } catch {
            // Ignore errors when checking for latest version
          }
        }
      }

      // Try to get additional metadata from pkg.go.dev
      const additionalMetadata = await this.fetchAdditionalMetadata(
        packageName
      );

      return {
        name: packageName,
        version: targetVersion,
        license: additionalMetadata.license,
        lastUpdated: lastUpdated,
        size: 0, // Go proxy doesn't provide size information
        description: additionalMetadata.description,
        author: "",
        homepage: `https://pkg.go.dev/${packageName}`,
        repository: additionalMetadata.repository,
        isOutdated: isOutdated,
        hasUnknownLicense: additionalMetadata.license === "Unknown",
      };
    } catch (error) {
      throw new Error(`Failed to fetch Go module metadata: ${error}`);
    }
  }

  private async fetchAdditionalMetadata(packageName: string): Promise<{
    license: string;
    description: string;
    repository: string;
  }> {
    try {
      // This is a simplified approach - in a real implementation,
      // you might want to parse the pkg.go.dev page or use other sources
      const repository = this.inferRepositoryUrl(packageName);

      return {
        license: "Unknown", // License detection would require parsing the source
        description: "",
        repository: repository,
      };
    } catch {
      return {
        license: "Unknown",
        description: "",
        repository: "",
      };
    }
  }

  private inferRepositoryUrl(packageName: string): string {
    // Common patterns for Go module paths
    if (packageName.startsWith("github.com/")) {
      return `https://${packageName}`;
    }
    if (packageName.startsWith("gitlab.com/")) {
      return `https://${packageName}`;
    }
    if (packageName.startsWith("bitbucket.org/")) {
      return `https://${packageName}`;
    }

    return "";
  }

  private compareVersions(version1: string, version2: string): number {
    // Remove 'v' prefix if present
    const cleanV1 = version1.replace(/^v/, "");
    const cleanV2 = version2.replace(/^v/, "");

    const parts1 = cleanV1.split(".").map((part) => {
      const num = parseInt(part.replace(/[^\d]/g, ""), 10);
      return isNaN(num) ? 0 : num;
    });
    const parts2 = cleanV2.split(".").map((part) => {
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
