import * as vscode from "vscode";
import {
  DependencyFile,
  DependencyFileType,
  DependencyLanguage,
  ScanSummary,
} from "../types";
import { IDependencyScanner } from "./interfaces";
import { DEPENDENCY_FILE_CONFIGS, EXCLUDE_PATTERNS } from "./config";

export class BaseDependencyScanner implements IDependencyScanner {
  public async scanWorkspace(): Promise<DependencyFile[]> {
    const dependencyFiles: DependencyFile[] = [];

    if (!vscode.workspace.workspaceFolders) {
      console.log("No workspace folders found");
      return dependencyFiles;
    }

    for (const workspaceFolder of vscode.workspace.workspaceFolders) {
      const filesInWorkspace = await this.scanWorkspaceFolder(workspaceFolder);
      dependencyFiles.push(...filesInWorkspace);
    }

    return dependencyFiles;
  }

  public async scanWorkspaceFolder(
    workspaceFolder: vscode.WorkspaceFolder
  ): Promise<DependencyFile[]> {
    const dependencyFiles: DependencyFile[] = [];

    try {
      for (const fileConfig of DEPENDENCY_FILE_CONFIGS) {
        const pattern = new vscode.RelativePattern(
          workspaceFolder,
          fileConfig.pattern
        );
        const excludePattern = `{${EXCLUDE_PATTERNS.join(",")}}`;
        const foundFiles = await vscode.workspace.findFiles(
          pattern,
          excludePattern
        );

        for (const fileUri of foundFiles) {
          const relativePath = vscode.workspace.asRelativePath(fileUri, false);

          dependencyFiles.push({
            type: fileConfig.type,
            language: fileConfig.language,
            filePath: fileUri.fsPath,
            relativePath: relativePath,
            workspaceFolder: workspaceFolder,
          });
        }
      }
    } catch (error) {
      console.error(
        `Error scanning workspace folder ${workspaceFolder.name}:`,
        error
      );
    }

    return dependencyFiles.sort((a, b) =>
      a.relativePath.localeCompare(b.relativePath)
    );
  }

  public async scanForFileType(
    type: DependencyFileType
  ): Promise<DependencyFile[]> {
    const allFiles = await this.scanWorkspace();
    return allFiles.filter((file) => file.type === type);
  }

  public async scanForLanguage(
    language: DependencyLanguage
  ): Promise<DependencyFile[]> {
    const allFiles = await this.scanWorkspace();
    return allFiles.filter((file) => file.language === language);
  }

  public async getFilesByLanguage(): Promise<Map<string, DependencyFile[]>> {
    const allFiles = await this.scanWorkspace();
    const filesByLanguage = new Map<string, DependencyFile[]>();

    for (const file of allFiles) {
      if (!filesByLanguage.has(file.language)) {
        filesByLanguage.set(file.language, []);
      }
      filesByLanguage.get(file.language)!.push(file);
    }

    return filesByLanguage;
  }

  public async getScanSummary(): Promise<ScanSummary> {
    const files = await this.scanWorkspace();
    const filesByType: Record<string, number> = {};
    const filesByLanguage: Record<string, number> = {};

    for (const file of files) {
      filesByType[file.type] = (filesByType[file.type] || 0) + 1;
      filesByLanguage[file.language] =
        (filesByLanguage[file.language] || 0) + 1;
    }

    return {
      totalFiles: files.length,
      filesByType,
      filesByLanguage,
      files,
    };
  }
}
