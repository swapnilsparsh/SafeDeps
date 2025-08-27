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
      } else {
        const latestVersion = data["dist-tags"]?.latest;
        versionData = data.versions[latestVersion];
      }

      if (!versionData) {
        throw new Error(`Version ${version || "latest"} not found`);
      }

      const lastUpdated = data.time[versionData.version] || data.time.modified;

      const metadata: PackageMetadata = {
        name: packageName,
        version: versionData.version,
        license: this.extractLicense(versionData.license),
        lastUpdated: new Date(lastUpdated),
        size: this.extractSize(versionData.dist),
        description: versionData.description || "",
        author: this.extractAuthor(versionData.author),
        homepage: versionData.homepage || "",
        repository: this.extractRepository(versionData.repository),
        isOutdated: this.isPackageOutdated(new Date(lastUpdated)),
        hasUnknownLicense: this.isLicenseUnknown(versionData.license),
      };

      this.cache.set(cacheKey, metadata);
      return metadata;
    } catch (error) {
      console.error(`Error fetching metadata for ${packageName}:`, error);

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
      return 0;
    }

    return dist.unpackedSize || dist.size || 0;
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

  private isPackageOutdated(lastUpdated: Date): boolean {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return lastUpdated < oneYearAgo;
  }

  private isLicenseUnknown(license: any): boolean {
    if (!license) {
      return true;
    }

    const licenseString = this.extractLicense(license).toLowerCase();
    return (
      licenseString === "unknown" ||
      licenseString === "" ||
      licenseString === "unlicensed" ||
      licenseString === "none"
    );
  }
}
