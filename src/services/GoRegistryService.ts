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
  Origin?: {
    VCS: string;
    URL: string;
    Subdir?: string;
    Ref?: string;
  };
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

interface GitHubRepoResponse {
  name: string;
  description: string | null;
  license: {
    key: string;
    name: string;
    spdx_id: string;
  } | null;
  size: number;
  updated_at: string;
  clone_url: string;
  homepage: string | null;
  language: string;
  stargazers_count: number;
}

export class GoRegistryService
  extends BaseRegistryService
  implements IGoRegistryService
{
  private readonly GO_PROXY_URL = "https://proxy.golang.org";
  private readonly GITHUB_API_URL = "https://api.github.com";

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
              const latestData = (await latestResponse.json()) as GoProxyResponse;
              isOutdated = this.compareVersions(version, latestData.Version) < 0;
            }
          } catch {
            // Ignore errors when checking for latest version
          }
        }
      }

      // Get module size from ZIP file
      const moduleSize = await this.fetchModuleSize(packageName, targetVersion);

      // Try to get additional metadata (license, description) from various sources
      const additionalMetadata = await this.fetchAdditionalMetadata(packageName);

      return {
        name: packageName,
        version: targetVersion,
        license: additionalMetadata.license,
        lastUpdated: lastUpdated,
        size: moduleSize,
        description: additionalMetadata.description,
        author: additionalMetadata.author,
        homepage: `https://pkg.go.dev/${packageName}`,
        repository: additionalMetadata.repository,
        isOutdated: isOutdated,
        hasUnknownLicense: additionalMetadata.license === "Unknown",
      };
    } catch (error) {
      throw new Error(`Failed to fetch Go module metadata: ${error}`);
    }
  }

  private async fetchModuleSize(packageName: string, version: string): Promise<number> {
    try {
      // First try with the specific version
      let zipUrl = `${this.GO_PROXY_URL}/${encodeURIComponent(
        packageName
      )}/@v/${encodeURIComponent(version)}.zip`;
      
      let zipResponse = await fetch(zipUrl, { method: 'HEAD' });
      
      // If specific version fails, try with latest
      if (!zipResponse.ok) {
        const latestUrl = `${this.GO_PROXY_URL}/${encodeURIComponent(packageName)}/@latest`;
        const latestResponse = await fetch(latestUrl);
        if (latestResponse.ok) {
          const latestData = (await latestResponse.json()) as GoProxyResponse;
          zipUrl = `${this.GO_PROXY_URL}/${encodeURIComponent(
            packageName
          )}/@v/${encodeURIComponent(latestData.Version)}.zip`;
          zipResponse = await fetch(zipUrl, { method: 'HEAD' });
        }
      }
      
      if (zipResponse.ok) {
        const contentLength = zipResponse.headers.get('content-length');
        return contentLength ? parseInt(contentLength, 10) : 0;
      }
      return 0;
    } catch {
      return 0;
    }
  }

  private async fetchAdditionalMetadata(packageName: string): Promise<{
    license: string;
    description: string;
    repository: string;
    author: string;
  }> {
    try {
      // For GitHub packages, fetch from GitHub API
      if (packageName.startsWith("github.com/")) {
        return await this.fetchGitHubMetadata(packageName);
      }
      
      // For golang.org/x packages, they are BSD-3-Clause licensed
      if (packageName.startsWith("golang.org/x/")) {
        const subProject = packageName.replace("golang.org/x/", "");
        return {
          license: "BSD-3-Clause",
          description: `Go ${subProject} package`,
          repository: `https://go.googlesource.com/${subProject}`,
          author: "Go Team",
        };
      }

      // For google.golang.org packages
      if (packageName.startsWith("google.golang.org/")) {
        if (packageName === "google.golang.org/protobuf") {
          return {
            license: "BSD-3-Clause",
            description: "Go Protocol Buffers",
            repository: "https://go.googlesource.com/protobuf",
            author: "Go Team",
          };
        }
        if (packageName === "google.golang.org/appengine") {
          return {
            license: "Apache-2.0",
            description: "Go App Engine SDK",
            repository: "https://github.com/golang/appengine",
            author: "Go Team",
          };
        }
      }
      
      // For other packages, try to infer repository and use basic info
      const repository = this.inferRepositoryUrl(packageName);
      
      return {
        license: "Unknown",
        description: "",
        repository: repository,
        author: "",
      };
    } catch {
      return {
        license: "Unknown",
        description: "",
        repository: this.inferRepositoryUrl(packageName),
        author: "",
      };
    }
  }

  private async fetchGitHubMetadata(packageName: string): Promise<{
    license: string;
    description: string;
    repository: string;
    author: string;
  }> {
    try {
      const pathParts = packageName.split('/');
      const owner = pathParts[1]; // github.com/owner/repo
      const repo = pathParts[2];
      
      const githubUrl = `${this.GITHUB_API_URL}/repos/${owner}/${repo}`;
      const response = await fetch(githubUrl);
      
      if (response.ok) {
        const data = (await response.json()) as GitHubRepoResponse;
        
        return {
          license: data.license?.spdx_id || data.license?.name || "Unknown",
          description: data.description || "",
          repository: `https://github.com/${owner}/${repo}`,
          author: owner,
        };
      }
      
      // Fallback if GitHub API fails
      return {
        license: "Unknown",
        description: "",
        repository: `https://github.com/${owner}/${repo}`,
        author: owner,
      };
    } catch {
      return {
        license: "Unknown", 
        description: "",
        repository: this.inferRepositoryUrl(packageName),
        author: "",
      };
    }
  }

  private inferRepositoryUrl(packageName: string): string {
    // Common patterns for Go module paths
    if (packageName.startsWith("github.com/")) {
      const pathParts = packageName.split('/');
      return `https://github.com/${pathParts[1]}/${pathParts[2]}`;
    }
    if (packageName.startsWith("gitlab.com/")) {
      return `https://${packageName}`;
    }
    if (packageName.startsWith("bitbucket.org/")) {
      return `https://${packageName}`;
    }
    if (packageName.startsWith("golang.org/x/")) {
      const subProject = packageName.replace("golang.org/x/", "");
      return `https://go.googlesource.com/${subProject}`;
    }
    if (packageName.startsWith("google.golang.org/")) {
      // Map google.golang.org packages to their actual repositories
      if (packageName === "google.golang.org/protobuf") {
        return "https://go.googlesource.com/protobuf";
      }
      if (packageName === "google.golang.org/appengine") {
        return "https://github.com/golang/appengine";
      }
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
