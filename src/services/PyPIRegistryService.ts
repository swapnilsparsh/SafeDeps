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
      const url = version
        ? `${this.PYPI_API_URL}/${encodeURIComponent(
            packageName
          )}/${encodeURIComponent(version)}/json`
        : `${this.PYPI_API_URL}/${encodeURIComponent(packageName)}/json`;

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

      const data = (await response.json()) as PyPIResponse;
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

  private mapPyPIResponseToMetadata(
    data: PyPIResponse,
    requestedName: string,
    requestedVersion?: string
  ): PackageMetadata {
    const info = data.info;
    const currentVersion = info.version;
    const targetVersion = requestedVersion || currentVersion;

    // Check if package is outdated
    const isOutdated = requestedVersion
      ? this.compareVersions(requestedVersion, currentVersion) < 0
      : false;

    // Get upload time for the specific version
    let lastUpdated = new Date();
    let packageSize = 0;

    if (data.releases[targetVersion]) {
      const releases = data.releases[targetVersion];
      if (releases.length > 0) {
        lastUpdated = new Date(releases[0].upload_time);
        packageSize = releases[0].size || 0;
      }
    }

    // Extract license information
    let license = info.license || "Unknown";
    if (!license || license === "Unknown" || license.trim() === "") {
      // Try to extract from classifiers
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
