import * as vscode from "vscode";
import {
  DependencyFile,
  DependencyFileType,
  DependencyLanguage,
} from "../types";

export interface IDependencyScanner {
  scanWorkspace(): Promise<DependencyFile[]>;
  scanWorkspaceFolder(
    workspaceFolder: vscode.WorkspaceFolder
  ): Promise<DependencyFile[]>;
  scanForFileType(type: DependencyFileType): Promise<DependencyFile[]>;
  scanForLanguage(language: DependencyLanguage): Promise<DependencyFile[]>;
}

export interface IScanConfig {
  pattern: string;
  type: DependencyFileType;
  language: DependencyLanguage;
}
