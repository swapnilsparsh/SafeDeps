import { PackageMetadata } from "../types";
import { BaseRegistryService } from "./BaseRegistryService";

export interface IPyPIRegistryService {
  fetchPackageMetadata(
    packageName: string,
    version?: string
  ): Promise<PackageMetadata>;
}

interface PyPIResponse {
  info: {
    name: string;
    version: string;
    summary?: string;
    description?: string;
    license?: string;
    license_expression?: string; // Modern PyPI API field
    license_files?: string[]; // Additional license info
    author?: string;
    author_email?: string;
    home_page?: string;
    project_urls?: Record<string, string>;
    classifiers?: string[];
  };
  releases: Record<
    string,
    Array<{
      upload_time: string;
      size?: number;
      [key: string]: any;
    }>
  >;
}

export class PyPIRegistryService
  extends BaseRegistryService
  implements IPyPIRegistryService
{
  private readonly PYPI_API_URL = "https://pypi.org/pypi";

  public getEcosystem(): string {
    return "PyPI";
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
      // Always use the general endpoint to get complete release data
      // The specific version endpoint doesn't include releases information
      const url = `${this.PYPI_API_URL}/${encodeURIComponent(
        packageName
      )}/json`;

      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(
            `PyPI package not found: ${packageName} version ${
              version || "latest"
            }`
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

      const data = (await response.json()) as PyPIResponse;

      // Validate the response data
      if (!data || !data.info) {
        throw new Error(
          `Invalid PyPI response: missing info object for ${packageName}`
        );
      }

      const metadata = this.mapPyPIResponseToMetadata(
        data,
        packageName,
        version
      );

      this.cache.set(cacheKey, metadata);
      return metadata;
    } catch (error) {
      console.error(`Error fetching PyPI metadata for ${packageName}:`, error);
      const defaultMetadata = this.createDefaultMetadata(
        packageName,
        version || "latest"
      );
      this.cache.set(cacheKey, defaultMetadata);
      return defaultMetadata;
    }
  }

  private cleanVersionString(version: string): string {
    // Remove version operators (==, >=, <=, >, <, ~=, !=) and return just the version number
    // Also handle complex version specs like ">=1.0.0,<2.0.0" by taking the first version
    const cleaned = version.replace(/^(==|>=|<=|>|<|~=|!=)/, "").trim();

    // Handle comma-separated version specs by taking the first part
    const firstVersion = cleaned.split(",")[0].trim();

    // Encode the cleaned version for URL use
    return encodeURIComponent(firstVersion);
  }

  private getCleanVersionForComparison(version: string): string {
    // Same as cleanVersionString but without encoding - for internal comparison
    const cleaned = version.replace(/^(==|>=|<=|>|<|~=|!=)/, "").trim();
    return cleaned.split(",")[0].trim();
  }

  private mapPyPIResponseToMetadata(
    data: PyPIResponse,
    requestedName: string,
    requestedVersion?: string
  ): PackageMetadata {
    const info = data.info;
    const currentVersion = info.version;

    // Clean the requested version for lookup in releases
    const cleanRequestedVersion = requestedVersion
      ? this.getCleanVersionForComparison(requestedVersion)
      : undefined;

    // Use cleaned requested version or current version for release lookup
    const targetVersion = cleanRequestedVersion || currentVersion;
    const originalRequestedVersion = requestedVersion;

    // Check if package is outdated using the original version string
    const isOutdated =
      originalRequestedVersion && cleanRequestedVersion
        ? this.compareVersions(cleanRequestedVersion, currentVersion) < 0
        : false;

    // Get upload time for the specific version from releases
    let lastUpdated = new Date();
    let packageSize = 0;

    // Try to find the release data using the target version
    if (data.releases && typeof data.releases === "object") {
      // Try different version formats to find the release
      const versionKeys = [
        targetVersion,
        // Try without 'v' prefix if present
        targetVersion.replace(/^v/, ""),
        // Try exact match from the releases keys
        Object.keys(data.releases).find(
          (key) =>
            key === targetVersion ||
            key === targetVersion.replace(/^v/, "") ||
            key.replace(/^v/, "") === targetVersion.replace(/^v/, "")
        ),
      ].filter(Boolean);

      for (const versionKey of versionKeys) {
        if (
          versionKey &&
          data.releases[versionKey] &&
          Array.isArray(data.releases[versionKey])
        ) {
          const releases = data.releases[versionKey];
          if (releases.length > 0) {
            // Use the wheel file if available, otherwise use the first file
            const preferredRelease =
              releases.find((r) => r.packagetype === "bdist_wheel") ||
              releases[0];
            lastUpdated = new Date(preferredRelease.upload_time);
            packageSize = preferredRelease.size || 0;
            break;
          }
        }
      }
    }

    // Extract license information using modern PyPI API fields
    let license = "Unknown";

    // Priority order: license_expression (modern) > license (legacy) > classifiers (fallback)
    if (info.license_expression && info.license_expression.trim() !== "") {
      license = info.license_expression.trim();
    } else if (
      info.license &&
      info.license.trim() !== "" &&
      info.license !== "UNKNOWN"
    ) {
      license = info.license.trim();
    } else {
      // Try to extract from classifiers as fallback
      const licenseClassifiers =
        info.classifiers?.filter((c) => c.startsWith("License ::")) || [];
      if (licenseClassifiers.length > 0) {
        license = licenseClassifiers[0].replace("License :: ", "");
      }
    }

    const hasUnknownLicense =
      !license ||
      license === "Unknown" ||
      license.trim() === "" ||
      license.toLowerCase().includes("unknown");

    // Get repository URL
    let repository = "";
    if (info.project_urls) {
      repository =
        info.project_urls["Repository"] ||
        info.project_urls["Source"] ||
        info.project_urls["GitHub"] ||
        "";
    }

    return {
      name: info.name || requestedName,
      version: targetVersion,
      license: license,
      lastUpdated: lastUpdated,
      size: packageSize,
      description: info.summary || info.description || "",
      author: info.author || "",
      homepage: info.home_page || "",
      repository: repository,
      isOutdated: isOutdated,
      hasUnknownLicense: hasUnknownLicense,
    };
  }

  private compareVersions(version1: string, version2: string): number {
    // Simple version comparison - can be enhanced for more complex version schemes
    const parts1 = version1
      .replace(/[^\d.]/g, "")
      .split(".")
      .map(Number);
    const parts2 = version2
      .replace(/[^\d.]/g, "")
      .split(".")
      .map(Number);

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
