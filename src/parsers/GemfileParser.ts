import * as vscode from "vscode";
import { PackageDependency } from "../types";
import { BaseDependencyParser } from "./BaseDependencyParser";

export interface IGemfileParser {
  parseFile(filePath: string): Promise<PackageDependency[]>;
}

export class GemfileParser
  extends BaseDependencyParser
  implements IGemfileParser
{
  public getEcosystem(): string {
    return "RubyGems";
  }

  public getSupportedFileTypes(): string[] {
    return ["Gemfile"];
  }

  public async parseFile(filePath: string): Promise<PackageDependency[]> {
    try {
      const document = await vscode.workspace.openTextDocument(filePath);
      const content = document.getText();
      const dependencies: PackageDependency[] = [];

      const lines = content.split("\n").map((line) => line.trim());
      let currentGroup = "";

      for (const line of lines) {
        if (!line || line.startsWith("#")) {
          continue;
        }

        // Check for group blocks
        const groupMatch = line.match(/group\s+:(\w+)\s+do/);
        if (groupMatch) {
          currentGroup = groupMatch[1];
          continue;
        }

        // Reset group on end
        if (line === "end" && currentGroup) {
          currentGroup = "";
          continue;
        }

        const dependency = this.parseDependencyLine(line, currentGroup);
        if (dependency) {
          dependencies.push(dependency);
        }
      }

      return dependencies.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      throw new Error(
        `Failed to parse Gemfile at ${filePath}: ${(error as Error).message}`
      );
    }
  }

  private parseDependencyLine(
    line: string,
    currentGroup: string = ""
  ): PackageDependency | null {
    // Handle various gem declaration formats:
    // gem 'name'
    // gem 'name', 'version'
    // gem 'name', '~> version'
    // gem 'name', version: 'version'
    // gem 'name', require: false
    // gem 'name', git: 'url'
    // gem 'name', path: 'path'

    const gemMatches = [
      // gem 'name', 'version'
      /gem\s+['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"](?:\s*,.*)?$/,
      // gem 'name', version: 'version'
      /gem\s+['"]([^'"]+)['"]\s*,\s*version:\s*['"]([^'"]+)['"](?:\s*,.*)?$/,
      // gem 'name' (without explicit version)
      /gem\s+['"]([^'"]+)['"](?:\s*,\s*(?!version:).*)?$/,
    ];

    for (const pattern of gemMatches) {
      const match = line.match(pattern);
      if (match) {
        const name = match[1];
        const version = match[2] || "latest";

        // Skip if it's a path or git dependency
        if (line.includes("path:") || line.includes("git:")) {
          continue;
        }

        // Determine dependency type based on group or inline options
        let type: PackageDependency["type"] = "dependency";

        if (
          currentGroup === "development" ||
          currentGroup === "test" ||
          line.includes("group: :development") ||
          line.includes("group: :test")
        ) {
          type = "devDependency";
        } else if (
          currentGroup === "production" ||
          line.includes("group: :production")
        ) {
          type = "dependency";
        } else if (
          line.includes("require: false") ||
          line.includes("optional: true")
        ) {
          type = "optionalDependency";
        }

        return this.createDependency(
          name,
          this.cleanVersion(version),
          type,
          this.getEcosystem()
        );
      }
    }

    return null;
  }

  private cleanVersion(version: string): string {
    // Clean up version specifiers
    if (version === "latest" || !version) {
      return "latest";
    }

    // Remove common Ruby version specifiers like ~>, >=, etc.
    return version.replace(/^[~><=!\s]+/, "").trim();
  }
}
