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
    workspaceFolder: vscode.WorkspaceFolder,
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
        100, // Limit to prevent performance issues
      );

      for (const gitignoreUri of gitignoreFiles) {
        const gitignoreContent = await this.readGitIgnoreFile(
          gitignoreUri.fsPath,
        );
        const parsedPatterns = this.parseGitIgnore(
          gitignoreContent,
          gitignoreUri.fsPath,
          workspaceFolder.uri.fsPath,
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
    workspaceRoot: string,
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
    relativePath: string,
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
   * Validate that a file path should be excluded based on security patterns
   * Returns true if the file is security-sensitive and should never be scanned
   * This is a defensive check to ensure security patterns are working
   */
  public static isSecuritySensitiveFile(filePath: string): boolean {
    const normalizedPath = filePath.toLowerCase().replace(/\\/g, "/");
    const securityPatterns = this.getSecurityExcludePatterns();

    // Check for exact matches or partial matches on critical patterns
    const criticalFiles = [
      ".env",
      ".env.",
      ".envrc",
      ".aws",
      ".ssh",
      ".secret",
      "password",
      ".pem",
      ".key",
      ".pfx",
      "credentials",
      "auth.json",
      ".netrc",
      "kubeconfig",
      ".kube",
    ];

    return criticalFiles.some((pattern) => normalizedPath.includes(pattern));
  }

  /**
   * Get a human-readable explanation of why a file was excluded
   */
  public static getExclusionReason(filePath: string): string | null {
    const normalizedPath = filePath.toLowerCase().replace(/\\/g, "/");

    if (normalizedPath.includes(".env")) {
      return "Environment file (may contain secrets)";
    }
    if (normalizedPath.includes(".key") || normalizedPath.includes(".pem")) {
      return "Private key or certificate";
    }
    if (
      normalizedPath.includes(".aws") ||
      normalizedPath.includes("credentials")
    ) {
      return "Cloud credentials";
    }
    if (normalizedPath.includes(".ssh")) {
      return "SSH key or configuration";
    }
    if (normalizedPath.includes("password")) {
      return "Password file";
    }
    if (normalizedPath.includes(".secret")) {
      return "Secret file";
    }
    if (normalizedPath.includes("node_modules")) {
      return "Node.js dependencies";
    }
    if (normalizedPath.includes("__pycache__")) {
      return "Python cache";
    }
    if (normalizedPath.includes(".git/")) {
      return "Git repository data";
    }

    return null;
  }

  /**
   * Get security-sensitive patterns that should ALWAYS be excluded
   * These are enforced regardless of any user configuration or .gitignore settings
   * CRITICAL: Never scan files that may contain secrets, credentials, or sensitive data
   */
  public static getSecurityExcludePatterns(): string[] {
    return [
      // Environment files (can contain API keys, secrets, passwords)
      "**/.env",
      "**/.env.*",
      "**/.envrc",
      "**/env.local",
      "**/env.*.local",
      "**/.environment",
      "**/*.env",
      "**/.env.backup",
      "**/.env.production",
      "**/.env.development",
      "**/.env.test",
      "**/.env.staging",

      // Private keys and certificates
      "**/*.key",
      "**/*.pem",
      "**/*.pfx",
      "**/*.p12",
      "**/*.p7b",
      "**/*.cer",
      "**/*.crt",
      "**/*.der",
      "**/privatekey.pem",
      "**/privkey.pem",
      "**/fullchain.pem",
      "**/cert.pem",
      "**/*.keystore",
      "**/*.jks",
      "**/*.asc",

      // SSH and GPG
      "**/.ssh/**",
      "**/.gnupg/**",
      "**/.gnupg-temp/**",
      "**/id_rsa",
      "**/id_rsa.pub",
      "**/id_dsa",
      "**/id_ecdsa",
      "**/id_ed25519",
      "**/known_hosts",
      "**/authorized_keys",

      // AWS credentials and config
      "**/.aws/**",
      "**/credentials",
      "**/aws-credentials",
      "**/.aws-credentials",
      "**/aws_credentials",
      "**/.boto",

      // Cloud provider credentials
      "**/.azure/**",
      "**/.gcloud/**",
      "**/.config/gcloud/**",
      "**/gcp-credentials.json",
      "**/google-credentials.json",
      "**/service-account*.json",
      "**/firebase-adminsdk*.json",
      "**/.firebase/**",
      "**/firebaserc",

      // Secret management files
      "**/.secrets/**",
      "**/secrets.*",
      "**/*.secret",
      "**/.secret",
      "**/secret-*",
      "**/vault.json",
      "**/.vault-token",
      "**/secret-store/**",
      "**/*.credentials",

      // Password and authentication files
      "**/password",
      "**/passwords",
      "**/.password",
      "**/.passwords",
      "**/auth.json",
      "**/.authinfo",
      "**/.netrc",
      "**/.npmrc",
      "**/.yarnrc",
      "**/.yarnrc.yml",
      "**/pip.conf",
      "**/.pypirc",
      "**/.gem/credentials",
      "**/rubygems-credentials",
      "**/.bundler/config",

      // Database dumps and backups
      "**/*.sql",
      "**/*.sqlite",
      "**/*.sqlite3",
      "**/*.db",
      "**/*.dump",
      "**/dump.rdb",
      "**/*.bak",
      "**/*.backup",
      "**/*.mdf",
      "**/*.ldf",

      // Docker and Kubernetes secrets
      "**/docker-compose.override.yml",
      "**/docker-compose.*.yml",
      "**/.dockercfg",
      "**/.docker/**",
      "**/config.json",
      "**/.kube/**",
      "**/kubeconfig",
      "**/kube-config",
      "**/*-kubeconfig.yaml",

      // CI/CD and service configuration (may contain secrets)
      "**/.circleci/config.yml",
      "**/.travis.yml",
      "**/appveyor.yml",
      "**/.gitlab-ci.yml",
      "**/azure-pipelines.yml",
      "**/.drone.yml",
      "**/jenkins-credentials.xml",
      "**/.github/secrets/**",

      // macOS Keychain
      "**/*.keychain",
      "**/*.keychain-db",

      // Backup and temporary files (may contain sensitive data)
      "**/*~",
      "**/*.swp",
      "**/*.swo",
      "**/*.swn",
      "**/*.bak",
      "**/*.old",
      "**/*.orig",
      "**/*.tmp",
      "**/._*",
      "**/.DS_Store",

      // IDE-specific sensitive files
      "**/.vscode/settings.json",
      "**/.idea/workspace.xml",
      "**/.idea/tasks.xml",
      "**/.idea/dictionaries/**",
      "**/.idea/httpRequests/**",
      "**/.idea/security.xml",

      // Log files that may contain sensitive data
      "**/*.log",
      "**/logs/**",
      "**/.npm/_logs/**",
      "**/npm-debug.log*",
      "**/yarn-debug.log*",
      "**/yarn-error.log*",

      // Configuration files that might contain secrets
      "**/config.local.*",
      "**/config.*.local.*",
      "**/.config.local",
      "**/local.config.js",
      "**/local.settings.json",

      // Token and API key files
      "**/*token*",
      "**/*apikey*",
      "**/*api-key*",
      "**/*api_key*",
      "**/.git-credentials",
      "**/.gitconfig",

      // Terraform and infrastructure secrets
      "**/*.tfvars",
      "**/*.tfstate",
      "**/*.tfstate.backup",
      "**/terraform.tfvars",

      // History files (may contain sensitive commands)
      "**/.bash_history",
      "**/.zsh_history",
      "**/.history",
      "**/.node_repl_history",
      "**/.python_history",
    ];
  }

  /**
   * Verify the integrity of security exclusions
   * Returns diagnostic information about the security implementation
   */
  public static verifySecurityImplementation(): {
    isValid: boolean;
    securityPatternCount: number;
    criticalPatternsPresent: boolean;
    issues: string[];
  } {
    const securityPatterns = this.getSecurityExcludePatterns();
    const issues: string[] = [];

    // Check minimum pattern count
    if (securityPatterns.length < 100) {
      issues.push(
        `Security pattern count too low: ${securityPatterns.length} (expected 100+)`,
      );
    }

    // Verify critical patterns are present
    const criticalPatterns = [
      "**/.env",
      "**/.env.*",
      "**/*.key",
      "**/*.pem",
      "**/credentials",
      "**/.aws/**",
      "**/.ssh/**",
      "**/password",
      "**/.kube/**",
      "**/*.tfstate",
    ];

    const missingCritical = criticalPatterns.filter(
      (pattern) => !securityPatterns.includes(pattern),
    );

    if (missingCritical.length > 0) {
      issues.push(`Missing critical patterns: ${missingCritical.join(", ")}`);
    }

    return {
      isValid: issues.length === 0,
      securityPatternCount: securityPatterns.length,
      criticalPatternsPresent: missingCritical.length === 0,
      issues,
    };
  }

  /**
   * Get common build/cache directories that should be excluded by default
   * These are fallback patterns when .gitignore doesn't exist or is disabled
   * Users can override this behavior via configuration
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
