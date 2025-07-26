import {
  VulnerabilityInfo,
  OsvVulnerabilityResponse,
  OsvQueryRequest,
} from "../types";

export interface IOsvService {
  checkVulnerability(
    packageName: string,
    version: string,
    ecosystem: string
  ): Promise<VulnerabilityInfo[]>;
  checkMultipleVulnerabilities(
    packages: { name: string; version: string; ecosystem: string }[]
  ): Promise<Map<string, VulnerabilityInfo[]>>;
}

export class OsvService implements IOsvService {
  private readonly OSV_API_URL = "https://api.osv.dev";
  private cache = new Map<string, VulnerabilityInfo[]>();

  public async checkVulnerability(
    packageName: string,
    version: string,
    ecosystem: string
  ): Promise<VulnerabilityInfo[]> {
    const cacheKey = `${ecosystem}:${packageName}@${version}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const query: OsvQueryRequest = {
        package: {
          name: packageName,
          ecosystem: ecosystem,
        },
        version: version,
      };

      const response = await fetch(`${this.OSV_API_URL}/v1/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(query),
      });

      if (!response.ok) {
        throw new Error(
          `OSV API error: ${response.status} ${response.statusText}`
        );
      }

      const data = (await response.json()) as OsvVulnerabilityResponse;
      const vulnerabilities = this.processVulnerabilities(data.vul || []);

      this.cache.set(cacheKey, vulnerabilities);
      return vulnerabilities;
    } catch (error) {
      console.error(`Error checking vulnerability for ${packageName}:`, error);
      return [];
    }
  }

  public async checkMultipleVulnerabilities(
    packages: { name: string; version: string; ecosystem: string }[]
  ): Promise<Map<string, VulnerabilityInfo[]>> {
    const results = new Map<string, VulnerabilityInfo[]>();

    const batchSize = 10;
    for (let i = 0; i < packages.length; i += batchSize) {
      const batch = packages.slice(i, i + batchSize);

      const promises = batch.map(async (pkg) => {
        try {
          const vulnerabilities = await this.checkVulnerability(
            pkg.name,
            pkg.version,
            pkg.ecosystem
          );
          results.set(pkg.name, vulnerabilities);
        } catch (error) {
          console.error(
            `Failed to check vulnerabilities for ${pkg.name}:`,
            error
          );
          results.set(pkg.name, []);
        }
      });

      await Promise.all(promises);

      if (i + batchSize < packages.length) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    return results;
  }

  private processVulnerabilities(vul: any[]): VulnerabilityInfo[] {
    return vul.map((vuln) => {
      const severity = this.extractSeverity(vuln);
      const cveIds = this.extractCveIds(vuln);

      return {
        id: vuln.id,
        summary: vuln.summary || "No summary available",
        details: vuln.details || "",
        severity: severity,
        cveIds: cveIds,
        published: vuln.published ? new Date(vuln.published) : undefined,
        modified: vuln.modified ? new Date(vuln.modified) : undefined,
        aliases: vuln.aliases || [],
        databaseSpecific: vuln.database_specific || {},
        references: this.extractReferences(vuln.references || []),
        affected: vuln.affected || [],
      };
    });
  }

  private extractSeverity(
    vuln: any
  ): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "UNKNOWN" {
    if (vuln.severity && Array.isArray(vuln.severity)) {
      for (const severity of vuln.severity) {
        if (severity.type === "CVSS_V3") {
          const score = severity.score;
          if (score >= 9.0) {
            return "CRITICAL";
          }
          if (score >= 7.0) {
            return "HIGH";
          }
          if (score >= 4.0) {
            return "MEDIUM";
          }
          if (score >= 0.1) {
            return "LOW";
          }
        }
      }
    }
    if (vuln.database_specific?.severity) {
      const severity = vuln.database_specific.severity.toUpperCase();
      if (["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(severity)) {
        return severity as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      }
    }

    if (vuln.ecosystem_specific?.severity) {
      const severity = vuln.ecosystem_specific.severity.toUpperCase();
      if (["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(severity)) {
        return severity as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      }
    }

    return "UNKNOWN";
  }

  private extractCveIds(vuln: any): string[] {
    const cveIds: string[] = [];

    if (vuln.aliases && Array.isArray(vuln.aliases)) {
      for (const alias of vuln.aliases) {
        if (typeof alias === "string" && alias.startsWith("CVE-")) {
          cveIds.push(alias);
        }
      }
    }

    if (vuln.references && Array.isArray(vuln.references)) {
      for (const ref of vuln.references) {
        if (ref.url && typeof ref.url === "string") {
          const cveMatch = ref.url.match(/CVE-\d{4}-\d+/);
          if (cveMatch && !cveIds.includes(cveMatch[0])) {
            cveIds.push(cveMatch[0]);
          }
        }
      }
    }

    return cveIds;
  }

  private extractReferences(
    references: any[]
  ): { type: string; url: string }[] {
    return references.map((ref) => ({
      type: ref.type || "UNKNOWN",
      url: ref.url || "",
    }));
  }

  public static getEcosystemForDependencyType(dependencyType: string): string {
    switch (dependencyType) {
      case "package.json":
        return "npm";
      case "requirements.txt":
        return "PyPI";
      case "go.mod":
        return "Go";
      case "Cargo.toml":
        return "crates.io";
      case "pom.xml":
      case "build.gradle":
        return "Maven";
      case "Gemfile":
        return "RubyGems";
      case "composer.json":
        return "Packagist";
      default:
        return "npm";
    }
  }
}
