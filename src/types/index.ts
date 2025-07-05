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

export interface PackageJsonSummary {
  totalPackageFiles: number;
  totalDependencies: number;
  dependencyBreakdown: Record<string, number>;
  packages: PackageJsonInfo[];
  allDependencies: { packageFile: string; dependency: PackageDependency }[];
}

export type DependencyFileType = DependencyFile["type"];
export type DependencyLanguage = DependencyFile["language"];
