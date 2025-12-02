import { PackageMetadata, NpmRegistryResponse } from "../types";
import { BaseRegistryService } from "./BaseRegistryService";

export interface INpmRegistryService {
  fetchPackageMetadata(
    packageName: string,
    version?: string
  ): Promise<PackageMetadata>;
  fetchMultiplePackageMetadata(
    packages: { name: string; version?: string }[]
  ): Promise<Map<string, PackageMetadata>>;
}

export class NpmRegistryService
  extends BaseRegistryService
  implements INpmRegistryService
{
  private readonly NPM_REGISTRY_URL = "https://registry.npmjs.org";

  public getEcosystem(): string {
    return "npm";
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
      const url = `${this.NPM_REGISTRY_URL}/${encodeURIComponent(packageName)}`;
      console.log(
        `[npm] Fetching metadata for ${packageName}@${
          version || "latest"
        } from ${url}`
      );
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as NpmRegistryResponse;

      let versionData;
      if (
        version &&
        version !== "latest" &&
        !version.startsWith("^") &&
        !version.startsWith("~") &&
        !version.startsWith(">=")
      ) {
        versionData = data.versions[version];
        console.log(
          `[npm] Looking for exact version ${version}:`,
          versionData ? "found" : "not found"
        );
      } else {
        const latestVersion = data["dist-tags"]?.latest;
        versionData = data.versions[latestVersion];
        console.log(
          `[npm] Using latest version ${latestVersion}:`,
          versionData ? "found" : "not found"
        );
      }

      if (!versionData) {
        console.warn(
          `[npm] Version ${version || "latest"} not found, available versions:`,
          Object.keys(data.versions).slice(0, 5)
        );
        throw new Error(`Version ${version || "latest"} not found`);
      }

      const lastUpdated = data.time[versionData.version] || data.time.modified;

      // Extract license with fallback to root level
      let license = this.extractLicense(versionData.license);
      if (license === "Unknown" && data.license) {
        console.log(
          `[npm] Version license unknown, using root license:`,
          data.license
        );
        license = this.extractLicense(data.license);
      }

      const size = this.extractSize(versionData.dist);

      // Determine if package is outdated by comparing versions
      const latestVersion = data["dist-tags"]?.latest || "";
      const currentVersion = versionData.version;
      const isOutdated = this.isVersionOutdated(currentVersion, latestVersion);

      console.log(
        `[npm] Extracted metadata for ${packageName}@${versionData.version}:`,
        {
          license,
          size,
          hasUnpackedSize: !!versionData.dist?.unpackedSize,
          currentVersion,
          latestVersion,
          isOutdated,
        }
      );

      const metadata: PackageMetadata = {
        name: packageName,
        version: versionData.version,
        license,
        lastUpdated: new Date(lastUpdated),
        size,
        description: versionData.description || "",
        author: this.extractAuthor(versionData.author),
        homepage: versionData.homepage || "",
        repository: this.extractRepository(versionData.repository),
        isOutdated,
        hasUnknownLicense: this.isLicenseUnknown(license),
      };

      this.cache.set(cacheKey, metadata);
      return metadata;
    } catch (error) {
      console.error(`[npm] Error fetching metadata for ${packageName}:`, error);

      const defaultMetadata = this.createDefaultMetadata(
        packageName,
        version || "latest"
      );
      this.cache.set(cacheKey, defaultMetadata);
      return defaultMetadata;
    }
  }

  private extractLicense(license: any): string {
    if (!license) {
      return "Unknown";
    }

    if (typeof license === "string") {
      return license;
    }

    if (typeof license === "object") {
      if (license.type) {
        return license.type;
      }
      if (license.name) {
        return license.name;
      }
    }

    if (Array.isArray(license)) {
      return license
        .map((l) => (typeof l === "string" ? l : l.type || l.name || "Unknown"))
        .join(", ");
    }

    return "Unknown";
  }

  private extractSize(dist: any): number {
    if (!dist) {
      return -1; // Size unavailable
    }

    return dist.unpackedSize || dist.size || -1;
  }

  private extractAuthor(author: any): string {
    if (!author) {
      return "";
    }

    if (typeof author === "string") {
      return author;
    }

    if (typeof author === "object") {
      const name = author.name || "";
      const email = author.email ? ` <${author.email}>` : "";
      return `${name}${email}`.trim();
    }

    return "";
  }

  private extractRepository(repository: any): string {
    if (!repository) {
      return "";
    }

    if (typeof repository === "string") {
      return repository;
    }

    if (typeof repository === "object") {
      return repository.url || repository.repository || "";
    }

    return "";
  }

  /**
   * Check if a version is outdated by comparing with the latest version
   * @param currentVersion - The installed version (e.g., "1.2.3")
   * @param latestVersion - The latest available version (e.g., "2.0.0")
   * @returns true if current version is older than latest version
   */
  private isVersionOutdated(
    currentVersion: string,
    latestVersion: string
  ): boolean {
    if (!currentVersion || !latestVersion) {
      return false;
    }

    // If versions are identical, not outdated
    if (currentVersion === latestVersion) {
      return false;
    }

    try {
      return this.compareVersions(currentVersion, latestVersion) < 0;
    } catch (error) {
      console.error(
        `[npm] Error comparing versions ${currentVersion} vs ${latestVersion}:`,
        error
      );
      return false;
    }
  }

  /**
   * Compare two semantic versions
   * @param version1 - First version to compare
   * @param version2 - Second version to compare
   * @returns -1 if version1 < version2, 0 if equal, 1 if version1 > version2
   */
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

  private isLicenseUnknown(license: any): boolean {
    if (!license) {
      return true;
    }

    const licenseString =
      typeof license === "string" ? license : this.extractLicense(license);
    const normalized = licenseString.toLowerCase();
    return (
      normalized === "unknown" ||
      normalized === "" ||
      normalized === "unlicensed" ||
      normalized === "none"
    );
  }
}
