import * as vscode from "vscode";
import {
  DependencyFile,
  DependencyFileType,
  DependencyLanguage,
  ScanSummary,
} from "../types";
import { IDependencyScanner } from "./interfaces";
import { DEPENDENCY_FILE_CONFIGS } from "./config";
import { GitIgnoreService } from "../services/gitignore";

export class BaseDependencyScanner implements IDependencyScanner {
  protected gitIgnoreService: GitIgnoreService;

  constructor() {
    this.gitIgnoreService = new GitIgnoreService();
  }
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
      // Get combined exclude patterns from .gitignore and defaults
      const excludePatterns = await this.getExcludePatterns(workspaceFolder);
      const excludePattern =
        excludePatterns.length > 0
          ? `{${excludePatterns.join(",")}}`
          : undefined;

      for (const fileConfig of DEPENDENCY_FILE_CONFIGS) {
        const pattern = new vscode.RelativePattern(
          workspaceFolder,
          fileConfig.pattern
        );

        const foundFiles = await vscode.workspace.findFiles(
          pattern,
          excludePattern
        );

        for (const fileUri of foundFiles) {
          const relativePath = vscode.workspace.asRelativePath(fileUri, false);

          dependencyFiles.push({
            type: fileConfig.type,
            language: fileConfig.language,
            ecosystem: fileConfig.ecosystem,
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

  /**
   * Get combined exclude patterns from .gitignore files and default patterns
   */
  protected async getExcludePatterns(
    workspaceFolder: vscode.WorkspaceFolder
  ): Promise<string[]> {
    const patterns: string[] = [];

    // Always include default patterns
    patterns.push(...GitIgnoreService.getDefaultExcludePatterns());

    // Check configuration
    const config = vscode.workspace.getConfiguration("safedeps");
    const respectGitignore = config.get<boolean>("respectGitignore", true);
    const additionalPatterns = config.get<string[]>(
      "additionalExcludePatterns",
      []
    );

    // Add user-defined additional patterns
    if (additionalPatterns.length > 0) {
      patterns.push(...additionalPatterns);
    }

    // Add .gitignore patterns if enabled
    if (respectGitignore) {
      try {
        const gitignorePatterns =
          await this.gitIgnoreService.getGitIgnorePatterns(workspaceFolder);
        patterns.push(...gitignorePatterns);
      } catch (error) {
        console.error("Error reading .gitignore patterns:", error);
      }
    }

    // Remove duplicates
    return [...new Set(patterns)];
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
