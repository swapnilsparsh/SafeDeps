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
      p: string; // packaging
      timestamp: number;
      versionCount?: number;
      repositoryId?: string;
      ec?: string[]; // extension classifiers
      text?: string[];
    }>;
  };
}

interface MavenGAVResponse {
  response: {
    numFound: number;
    docs: Array<{
      id: string;
      g: string; // groupId
      a: string; // artifactId
      v: string; // specific version
      p: string; // packaging
      timestamp: number;
      ec?: string[]; // extension classifiers
      tags?: string[];
    }>;
  };
}

export class MavenRegistryService
  extends BaseRegistryService
  implements IMavenRegistryService
{
  private readonly MAVEN_SEARCH_URL =
    "https://search.maven.org/solrsearch/select";
  private readonly MAVEN_CENTRAL_REPO = "https://repo1.maven.org/maven2";

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
      console.error(
        `[Maven] Error fetching metadata for ${packageName}:`,
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

      console.log(
        `[Maven] Fetching metadata for ${packageName}@${version || "latest"}`
      );

      // Search for the artifact to get latest version info
      const searchUrl = `${this.MAVEN_SEARCH_URL}?q=g:"${encodeURIComponent(
        groupId
      )}"+AND+a:"${encodeURIComponent(artifactId)}"&rows=1&wt=json`;
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

      console.log(
        `[Maven] Found artifact - latest version: ${latestVersion}, target version: ${targetVersion}`
      );

      // Check if the package is outdated
      const isOutdated = version
        ? this.compareVersions(version, latestVersion) < 0
        : false;

      // Get specific version timestamp
      let lastUpdated = new Date(artifact.timestamp);
      if (version && version !== latestVersion) {
        try {
          // Query for specific version using core=gav
          const versionUrl = `${
            this.MAVEN_SEARCH_URL
          }?q=g:"${encodeURIComponent(groupId)}"+AND+a:"${encodeURIComponent(
            artifactId
          )}"+AND+v:"${encodeURIComponent(version)}"&core=gav&rows=1&wt=json`;
          const versionResponse = await fetch(versionUrl);
          if (versionResponse.ok) {
            const versionData =
              (await versionResponse.json()) as MavenGAVResponse;
            if (versionData.response.numFound > 0) {
              lastUpdated = new Date(versionData.response.docs[0].timestamp);
            }
          }
        } catch {
          // Ignore errors when fetching specific version
        }
      }

      // Fetch license from POM file
      const license = await this.fetchLicenseFromPom(
        groupId,
        artifactId,
        targetVersion
      );

      // Fetch JAR size
      const size = await this.fetchJarSize(groupId, artifactId, targetVersion);

      console.log(
        `[Maven] Extracted metadata for ${packageName}@${targetVersion}:`,
        {
          license,
          size,
          lastUpdated: lastUpdated.toISOString(),
        }
      );

      return {
        name: packageName,
        version: targetVersion,
        license,
        lastUpdated: lastUpdated,
        size,
        description: "",
        author: "",
        homepage: `https://search.maven.org/artifact/${groupId}/${artifactId}/${targetVersion}/jar`,
        repository: `https://repo1.maven.org/maven2/${groupId.replace(
          /\./g,
          "/"
        )}/${artifactId}/${targetVersion}/`,
        isOutdated: isOutdated,
        hasUnknownLicense: license === "Unknown",
      };
    } catch (error) {
      throw new Error(`Failed to fetch Maven artifact metadata: ${error}`);
    }
  }

  private async fetchLicenseFromPom(
    groupId: string,
    artifactId: string,
    version: string
  ): Promise<string> {
    try {
      const pomUrl = `${this.MAVEN_CENTRAL_REPO}/${groupId.replace(
        /\./g,
        "/"
      )}/${artifactId}/${version}/${artifactId}-${version}.pom`;

      console.log(`[Maven] Fetching POM from ${pomUrl}`);
      const response = await fetch(pomUrl);

      if (!response.ok) {
        console.warn(`[Maven] Failed to fetch POM: HTTP ${response.status}`);
        return "Unknown";
      }

      const pomXml = await response.text();

      // Extract license from POM XML
      const licenseMatch = pomXml.match(/<license>\s*<name>(.*?)<\/name>/s);

      if (licenseMatch && licenseMatch[1]) {
        const license = licenseMatch[1].trim();
        console.log(`[Maven] Extracted license from POM:`, license);
        return license;
      }

      // If no license in current POM, check if there's a parent POM reference
      const parentMatch = pomXml.match(
        /<parent>[\s\S]*?<groupId>(.*?)<\/groupId>[\s\S]*?<artifactId>(.*?)<\/artifactId>[\s\S]*?<version>(.*?)<\/version>[\s\S]*?<\/parent>/
      );

      if (parentMatch) {
        const [, parentGroupId, parentArtifactId, parentVersion] = parentMatch;
        console.log(
          `[Maven] No license in POM, checking parent POM: ${parentGroupId}:${parentArtifactId}:${parentVersion}`
        );

        const parentPomUrl = `${
          this.MAVEN_CENTRAL_REPO
        }/${parentGroupId.replace(
          /\./g,
          "/"
        )}/${parentArtifactId}/${parentVersion}/${parentArtifactId}-${parentVersion}.pom`;

        const parentResponse = await fetch(parentPomUrl);
        if (parentResponse.ok) {
          const parentPomXml = await parentResponse.text();
          const parentLicenseMatch = parentPomXml.match(
            /<license>\s*<name>(.*?)<\/name>/s
          );

          if (parentLicenseMatch && parentLicenseMatch[1]) {
            const license = parentLicenseMatch[1].trim();
            console.log(`[Maven] Extracted license from parent POM:`, license);
            return license;
          }
        }
      }

      console.warn(`[Maven] No license found in POM or parent POM`);
      return "Unknown";
    } catch (error) {
      console.error(`[Maven] Error fetching license:`, error);
      return "Unknown";
    }
  }

  private async fetchJarSize(
    groupId: string,
    artifactId: string,
    version: string
  ): Promise<number> {
    try {
      const jarUrl = `${this.MAVEN_CENTRAL_REPO}/${groupId.replace(
        /\./g,
        "/"
      )}/${artifactId}/${version}/${artifactId}-${version}.jar`;

      console.log(`[Maven] Fetching JAR size from ${jarUrl}`);
      const response = await fetch(jarUrl, { method: "HEAD" });

      if (!response.ok) {
        console.warn(`[Maven] Failed to fetch JAR: HTTP ${response.status}`);
        return -1;
      }

      const contentLength = response.headers.get("content-length");
      if (contentLength) {
        const size = parseInt(contentLength, 10);
        console.log(`[Maven] JAR size: ${size} bytes`);
        return size;
      }

      console.warn(`[Maven] No Content-Length header in JAR response`);
      return -1;
    } catch (error) {
      console.error(`[Maven] Error fetching JAR size:`, error);
      return -1;
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
