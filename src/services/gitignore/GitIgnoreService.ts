import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

/**
 * Service to parse and handle .gitignore files
 * Converts .gitignore patterns to VS Code exclude patterns
 */
export class GitIgnoreService {
  private gitignoreCache: Map<string, string[]> = new Map();

  /**
   * Get all .gitignore patterns from workspace folders
   */
  public async getGitIgnorePatterns(
    workspaceFolder: vscode.WorkspaceFolder
  ): Promise<string[]> {
    const cacheKey = workspaceFolder.uri.fsPath;

    // Check cache first
    if (this.gitignoreCache.has(cacheKey)) {
      return this.gitignoreCache.get(cacheKey)!;
    }

    const patterns: string[] = [];

    try {
      // Find all .gitignore files in the workspace
      const gitignoreFiles = await vscode.workspace.findFiles(
        new vscode.RelativePattern(workspaceFolder, "**/.gitignore"),
        "**/node_modules/**", // Don't search in node_modules
        100 // Limit to prevent performance issues
      );

      for (const gitignoreUri of gitignoreFiles) {
        const gitignoreContent = await this.readGitIgnoreFile(
          gitignoreUri.fsPath
        );
        const parsedPatterns = this.parseGitIgnore(
          gitignoreContent,
          gitignoreUri.fsPath,
          workspaceFolder.uri.fsPath
        );
        patterns.push(...parsedPatterns);
      }

      // Cache the results
      this.gitignoreCache.set(cacheKey, patterns);
    } catch (error) {
      console.error("Error reading .gitignore files:", error);
    }

    return patterns;
  }

  /**
   * Read .gitignore file content
   */
  private async readGitIgnoreFile(filePath: string): Promise<string> {
    try {
      const content = await fs.promises.readFile(filePath, "utf8");
      return content;
    } catch (error) {
      console.error(`Error reading .gitignore file ${filePath}:`, error);
      return "";
    }
  }

  /**
   * Parse .gitignore content and convert to VS Code exclude patterns
   */
  private parseGitIgnore(
    content: string,
    gitignorePath: string,
    workspaceRoot: string
  ): string[] {
    const patterns: string[] = [];
    const lines = content.split(/\r?\n/);

    // Get the directory containing the .gitignore file
    const gitignoreDir = path.dirname(gitignorePath);
    const relativePath = path.relative(workspaceRoot, gitignoreDir);

    for (let line of lines) {
      // Remove comments and trim
      const commentIndex = line.indexOf("#");
      if (commentIndex !== -1) {
        line = line.substring(0, commentIndex);
      }
      line = line.trim();

      // Skip empty lines
      if (!line) {
        continue;
      }

      // Skip negation patterns (these are complex to handle)
      if (line.startsWith("!")) {
        continue;
      }

      // Convert gitignore pattern to VS Code glob pattern
      const vsCodePattern = this.convertToVSCodePattern(line, relativePath);
      if (vsCodePattern) {
        patterns.push(vsCodePattern);
      }
    }

    return patterns;
  }

  /**
   * Convert a .gitignore pattern to a VS Code glob pattern
   */
  private convertToVSCodePattern(
    gitignorePattern: string,
    relativePath: string
  ): string | null {
    let pattern = gitignorePattern;

    // Remove leading slash
    if (pattern.startsWith("/")) {
      pattern = pattern.substring(1);
    }

    // If the pattern is a directory (ends with /), match everything inside
    if (pattern.endsWith("/")) {
      pattern = pattern.substring(0, pattern.length - 1);
    }

    // Build the full pattern
    let vsCodePattern: string;

    if (relativePath && relativePath !== ".") {
      // .gitignore is in a subdirectory
      if (gitignorePattern.startsWith("/")) {
        // Absolute pattern relative to the .gitignore file
        vsCodePattern = `${relativePath}/${pattern}/**`;
      } else {
        // Relative pattern - could match anywhere under the .gitignore directory
        vsCodePattern = `${relativePath}/**/${pattern}/**`;
      }
    } else {
      // .gitignore is in the root
      if (gitignorePattern.startsWith("/")) {
        // Absolute pattern
        vsCodePattern = `${pattern}/**`;
      } else {
        // Relative pattern - could match anywhere
        vsCodePattern = `**/${pattern}/**`;
      }
    }

    return vsCodePattern;
  }

  /**
   * Clear the cache (useful when .gitignore files change)
   */
  public clearCache(): void {
    this.gitignoreCache.clear();
  }

  /**
   * Get common directories that should always be excluded
   * These are fallback patterns in case .gitignore doesn't exist
   */
  public static getDefaultExcludePatterns(): string[] {
    return [
      // Node.js / JavaScript / TypeScript
      "**/node_modules/**",
      "**/.next/**",
      "**/.nuxt/**",
      "**/out/**",
      "**/.output/**",
      "**/dist/**",
      "**/build/**",
      "**/.cache/**",
      "**/.parcel-cache/**",
      "**/.turbo/**",
      "**/.docusaurus/**",
      "**/.vuepress/**",
      "**/coverage/**",
      "**/.nyc_output/**",

      // Python
      "**/venv/**",
      "**/env/**",
      "**/.venv/**",
      "**/__pycache__/**",
      "**/.pytest_cache/**",
      "**/.tox/**",
      "**/.eggs/**",
      "**/pip-wheel-metadata/**",
      "**/*.egg-info/**",
      "**/htmlcov/**",

      // Java / Kotlin / Gradle / Maven
      "**/target/**",
      "**/.gradle/**",
      "**/build/**",
      "**/out/**",
      "**/.idea/**",
      "**/classes/**",
      "**/bin/**",

      // Ruby
      "**/vendor/bundle/**",
      "**/vendor/cache/**",
      "**/.bundle/**",

      // PHP
      "**/vendor/**",
      "**/composer.lock",

      // Go
      "**/vendor/**",

      // Rust
      "**/target/**",

      // General
      "**/.git/**",
      "**/.svn/**",
      "**/.hg/**",
      "**/tmp/**",
      "**/temp/**",
      "**/.DS_Store/**",
      "**/.sass-cache/**",
      "**/bower_components/**",
    ];
  }
}
