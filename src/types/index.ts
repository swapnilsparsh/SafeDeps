import * as vscode from "vscode";

export interface DependencyFile {
  type:
    | "package.json"
    | "requirements.txt"
    | "go.mod"
    | "Cargo.toml"
    | "pom.xml"
    | "build.gradle"
    | "Gemfile"
    | "composer.json";
  language:
    | "JavaScript/TypeScript"
    | "Python"
    | "Go"
    | "Rust"
    | "Java"
    | "Ruby"
    | "PHP";
  ecosystem:
    | "npm"
    | "PyPI"
    | "Go"
    | "crates.io"
    | "Maven"
    | "RubyGems"
    | "Packagist";
  filePath: string;
  relativePath: string;
  workspaceFolder: vscode.WorkspaceFolder;
}

export interface PackageDependency {
  name: string;
  version: string;
  type:
    | "dependency"
    | "devDependency"
    | "peerDependency"
    | "optionalDependency";
  ecosystem: string;
  vulnerabilities?: VulnerabilityInfo[];
}

export interface VulnerabilityInfo {
  id: string;
  summary: string;
  details: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "UNKNOWN";
  cveIds: string[];
  published?: Date;
  modified?: Date;
  aliases: string[];
  databaseSpecific: any;
  references: { type: string; url: string }[];
  affected: any[];
}

export interface OsvQueryRequest {
  package: {
    name: string;
    ecosystem: string;
  };
  version?: string;
}

export interface OsvVulnerabilityResponse {
  vul?: any[];
}

export interface PackageJsonInfo {
  filePath: string;
  relativePath: string;
  packageName?: string;
  version?: string;
  dependencies: PackageDependency[];
  totalDependencies: number;
  dependencyCounts: {
    dependencies: number;
    devDependencies: number;
    peerDependencies: number;
    optionalDependencies: number;
  };
}

export interface ScanSummary {
  totalFiles: number;
  filesByType: Record<string, number>;
  filesByLanguage: Record<string, number>;
  files: DependencyFile[];
}

export interface PackageMetadata {
  name: string;
  version: string;
  license: string;
  lastUpdated: Date;
  size: number;
  description: string;
  author: string;
  homepage: string;
  repository: string;
  isOutdated: boolean;
  hasUnknownLicense: boolean;
  vulnerabilities?: VulnerabilityInfo[];
  hasVulnerabilities?: boolean;
  vulnerabilityCount?: number;
  highestSeverity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export interface PackageDependencyWithMetadata extends PackageDependency {
  metadata?: PackageMetadata;
}

export interface PackageJsonInfoWithMetadata extends PackageJsonInfo {
  dependencies: PackageDependencyWithMetadata[];
}

export interface PackageJsonSummary {
  totalPackageFiles: number;
  totalDependencies: number;
  dependencyBreakdown: Record<string, number>;
  packages: PackageJsonInfo[];
  allDependencies: { packageFile: string; dependency: PackageDependency }[];
}

export interface PackageJsonSummaryWithMetadata {
  totalPackageFiles: number;
  totalDependencies: number;
  dependencyBreakdown: Record<string, number>;
  packages: PackageJsonInfoWithMetadata[];
  allDependencies: {
    packageFile: string;
    dependency: PackageDependencyWithMetadata;
  }[];
  outdatedPackages: number;
  unknownLicensePackages: number;
  vulnerablePackages: number;
  vulnerabilityBreakdown: {
    low: number;
    medium: number;
    high: number;
    critical: number;
    unknown: number;
  };
}

export interface UnifiedDependencySummary {
  totalFiles: number;
  totalDependencies: number;
  ecosystemBreakdown: Record<string, number>;
  vulnerablePackages: number;
  outdatedPackages: number;
  unknownLicensePackages: number;
  vulnerabilityBreakdown: {
    low: number;
    medium: number;
    high: number;
    critical: number;
    unknown: number;
  };
  files: Array<{
    file: DependencyFile;
    dependencies: Array<
      PackageDependency & {
        vulnerabilities: VulnerabilityInfo[];
        metadata?: PackageMetadata;
      }
    >;
  }>;
  allDependencies: Array<{
    file: DependencyFile;
    dependency: PackageDependency & {
      vulnerabilities: VulnerabilityInfo[];
      metadata?: PackageMetadata;
    };
  }>;
}

export interface NpmRegistryResponse {
  name: string;
  "dist-tags": {
    latest: string;
    [tag: string]: string;
  };
  versions: {
    [version: string]: {
      name: string;
      version: string;
      description?: string;
      license?:
        | string
        | { type: string; name?: string }
        | Array<string | { type: string; name?: string }>;
      author?: string | { name: string; email?: string };
      homepage?: string;
      repository?: string | { url: string; type?: string };
      dist: {
        size?: number;
        unpackedSize?: number;
        [key: string]: any;
      };
      [key: string]: any;
    };
  };
  time: {
    [version: string]: string;
    created: string;
    modified: string;
  };
  [key: string]: any;
}

export type DependencyFileType = DependencyFile["type"];
export type DependencyLanguage = DependencyFile["language"];
export type DependencyEcosystem = DependencyFile["ecosystem"];
