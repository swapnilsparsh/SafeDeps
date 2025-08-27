import { PackageMetadata } from "../types";
import { BaseRegistryService } from "./BaseRegistryService";

export interface IRubyGemsRegistryService {
  fetchPackageMetadata(
    packageName: string,
    version?: string
  ): Promise<PackageMetadata>;
}

interface RubyGemsResponse {
  name: string;
  downloads: number;
  version: string;
  version_created_at: string;
  version_downloads: number;
  platform: string;
  authors: string;
  info: string;
  licenses: string[];
  metadata: {
    homepage_uri?: string;
    source_code_uri?: string;
    bug_tracker_uri?: string;
    changelog_uri?: string;
    documentation_uri?: string;
    funding_uri?: string;
    mailing_list_uri?: string;
    wiki_uri?: string;
  };
  yanked: boolean;
  sha: string;
  project_uri: string;
  gem_uri: string;
  homepage_uri?: string;
  wiki_uri?: string;
  documentation_uri?: string;
  mailing_list_uri?: string;
  source_code_uri?: string;
  bug_tracker_uri?: string;
  changelog_uri?: string;
  funding_uri?: string;
  dependencies: {
    development: Array<{
      name: string;
      requirements: string;
    }>;
    runtime: Array<{
      name: string;
      requirements: string;
    }>;
  };
}

interface RubyGemsVersionsResponse {
  number: string;
  built_at: string;
  summary: string;
  description: string;
  authors: string;
  platform: string;
  ruby_version?: string;
  prerelease: boolean;
  licenses: string[];
  requirements: string[];
  sha: string;
}

export class RubyGemsRegistryService
  extends BaseRegistryService
  implements IRubyGemsRegistryService
{
  private readonly RUBYGEMS_API_URL = "https://rubygems.org/api/v1";

  public getEcosystem(): string {
    return "RubyGems";
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
      const metadata = await this.fetchFromRubyGems(packageName, version);
      this.cache.set(cacheKey, metadata);
      return metadata;
    } catch (error) {
      console.error(
        `Error fetching RubyGems metadata for ${packageName}:`,
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

  private async fetchFromRubyGems(
    packageName: string,
    version?: string
  ): Promise<PackageMetadata> {
    try {
      let gemUrl: string;
      let versionsUrl: string;

      if (version && version !== "latest") {
        gemUrl = `${this.RUBYGEMS_API_URL}/versions/${encodeURIComponent(
          packageName
        )}-${encodeURIComponent(version)}.json`;
        versionsUrl = `${this.RUBYGEMS_API_URL}/versions/${encodeURIComponent(
          packageName
        )}.json`;
      } else {
        gemUrl = `${this.RUBYGEMS_API_URL}/gems/${encodeURIComponent(
          packageName
        )}.json`;
        versionsUrl = `${this.RUBYGEMS_API_URL}/versions/${encodeURIComponent(
          packageName
        )}.json`;
      }

      const [gemResponse, versionsResponse] = await Promise.all([
        fetch(gemUrl),
        fetch(versionsUrl),
      ]);

      if (!gemResponse.ok) {
        if (gemResponse.status === 404) {
          throw new Error(`Gem not found: ${packageName}`);
        }
        throw new Error(
          `HTTP ${gemResponse.status}: ${gemResponse.statusText}`
        );
      }

      const gemData = (await gemResponse.json()) as RubyGemsResponse;
      let versionsData: RubyGemsVersionsResponse[] = [];

      if (versionsResponse.ok) {
        versionsData =
          (await versionsResponse.json()) as RubyGemsVersionsResponse[];
      }

      const currentVersion = gemData.version;
      const targetVersion = version || currentVersion;

      // Find the latest version for outdated check
      const latestVersion =
        versionsData.length > 0
          ? versionsData.find((v) => !v.prerelease)?.number ||
            versionsData[0].number
          : currentVersion;

      const isOutdated = version
        ? this.compareVersions(version, latestVersion) < 0
        : false;

      // Get version-specific data
      const versionData =
        versionsData.find((v) => v.number === targetVersion) || null;
      const lastUpdated = versionData
        ? new Date(versionData.built_at)
        : new Date(gemData.version_created_at);

      // Extract license information
      const licenses = gemData.licenses || [];
      const license = licenses.length > 0 ? licenses.join(", ") : "Unknown";
      const hasUnknownLicense =
        licenses.length === 0 ||
        license === "Unknown" ||
        license.toLowerCase().includes("unknown");

      // Get repository URL
      const repository =
        gemData.source_code_uri || gemData.metadata?.source_code_uri || "";

      // Get homepage
      const homepage =
        gemData.homepage_uri ||
        gemData.metadata?.homepage_uri ||
        `https://rubygems.org/gems/${packageName}`;

      return {
        name: gemData.name || packageName,
        version: targetVersion,
        license: license,
        lastUpdated: lastUpdated,
        size: 0, // Size not provided by RubyGems API
        description: gemData.info || "",
        author: gemData.authors || "",
        homepage: homepage,
        repository: repository,
        isOutdated: isOutdated,
        hasUnknownLicense: hasUnknownLicense,
      };
    } catch (error) {
      throw new Error(`Failed to fetch RubyGems metadata: ${error}`);
    }
  }

  private compareVersions(version1: string, version2: string): number {
    // Handle Ruby gem version comparison (semantic versioning)
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
