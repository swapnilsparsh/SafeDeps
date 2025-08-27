import { PackageMetadata } from "../types";
import { BaseRegistryService } from "./BaseRegistryService";

export interface IMavenRegistryService {
  fetchPackageMetadata(
    packageName: string,
    version?: string
  ): Promise<PackageMetadata>;
}

interface MavenSearchResponse {
  response: {
    numFound: number;
    docs: Array<{
      id: string;
      g: string; // groupId
      a: string; // artifactId
      latestVersion: string;
      repositoryId: string;
      p: string; // packaging
      timestamp: number;
      versionCount: number;
      text: string[];
      ec: string[]; // extension classifiers
    }>;
  };
}

interface MavenVersionResponse {
  response: {
    numFound: number;
    docs: Array<{
      id: string;
      g: string;
      a: string;
      v: string; // version
      p: string;
      timestamp: number;
      tags: string[];
    }>;
  };
}

export class MavenRegistryService
  extends BaseRegistryService
  implements IMavenRegistryService
{
  private readonly MAVEN_SEARCH_URL =
    "https://search.maven.org/solrsearch/select";

  public getEcosystem(): string {
    return "Maven";
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
      const metadata = await this.fetchFromMavenCentral(packageName, version);
      this.cache.set(cacheKey, metadata);
      return metadata;
    } catch (error) {
      console.error(`Error fetching Maven metadata for ${packageName}:`, error);
      const defaultMetadata = this.createDefaultMetadata(
        packageName,
        version || "latest"
      );
      this.cache.set(cacheKey, defaultMetadata);
      return defaultMetadata;
    }
  }

  private async fetchFromMavenCentral(
    packageName: string,
    version?: string
  ): Promise<PackageMetadata> {
    try {
      // Parse the package name (should be in format groupId:artifactId)
      const parts = packageName.split(":");
      if (parts.length < 2) {
        throw new Error(
          "Invalid Maven package format. Expected groupId:artifactId"
        );
      }

      const [groupId, artifactId] = parts;

      // Search for the artifact
      const searchUrl = `${this.MAVEN_SEARCH_URL}?q=g:"${encodeURIComponent(
        groupId
      )}"+AND+a:"${encodeURIComponent(artifactId)}"&core=gav&rows=1&wt=json`;
      const searchResponse = await fetch(searchUrl);

      if (!searchResponse.ok) {
        throw new Error(
          `HTTP ${searchResponse.status}: ${searchResponse.statusText}`
        );
      }

      const searchData = (await searchResponse.json()) as MavenSearchResponse;

      if (searchData.response.numFound === 0) {
        throw new Error(`Artifact not found: ${packageName}`);
      }

      const artifact = searchData.response.docs[0];
      const latestVersion = artifact.latestVersion;
      const targetVersion = version || latestVersion;

      // Check if the package is outdated
      const isOutdated = version
        ? this.compareVersions(version, latestVersion) < 0
        : false;

      // Get specific version information if available
      let lastUpdated = new Date(artifact.timestamp);
      if (version && version !== latestVersion) {
        try {
          const versionUrl = `${
            this.MAVEN_SEARCH_URL
          }?q=g:"${encodeURIComponent(groupId)}"+AND+a:"${encodeURIComponent(
            artifactId
          )}"+AND+v:"${encodeURIComponent(version)}"&core=gav&rows=1&wt=json`;
          const versionResponse = await fetch(versionUrl);
          if (versionResponse.ok) {
            const versionData =
              (await versionResponse.json()) as MavenVersionResponse;
            if (versionData.response.numFound > 0) {
              lastUpdated = new Date(versionData.response.docs[0].timestamp);
            }
          }
        } catch {
          // Ignore errors when fetching specific version
        }
      }

      return {
        name: packageName,
        version: targetVersion,
        license: "Unknown", // Maven Central doesn't provide license info in search API
        lastUpdated: lastUpdated,
        size: 0, // Size not available in search API
        description: "",
        author: "",
        homepage: `https://search.maven.org/artifact/${groupId}/${artifactId}/${targetVersion}/jar`,
        repository: `https://repo1.maven.org/maven2/${groupId.replace(
          /\./g,
          "/"
        )}/${artifactId}/${targetVersion}/`,
        isOutdated: isOutdated,
        hasUnknownLicense: true, // License info not readily available
      };
    } catch (error) {
      throw new Error(`Failed to fetch Maven artifact metadata: ${error}`);
    }
  }

  private compareVersions(version1: string, version2: string): number {
    // Simple semantic version comparison for Maven
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
