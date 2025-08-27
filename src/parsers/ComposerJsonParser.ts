import * as vscode from "vscode";
import { PackageDependency } from "../types";
import { BaseDependencyParser } from "./BaseDependencyParser";

export interface IComposerJsonParser {
  parseFile(filePath: string): Promise<PackageDependency[]>;
}

interface ComposerJson {
  name?: string;
  version?: string;
  require?: Record<string, string>;
  "require-dev"?: Record<string, string>;
  conflict?: Record<string, string>;
  replace?: Record<string, string>;
  provide?: Record<string, string>;
  suggest?: Record<string, string>;
}

export class ComposerJsonParser
  extends BaseDependencyParser
  implements IComposerJsonParser
{
  public getEcosystem(): string {
    return "Packagist";
  }

  public getSupportedFileTypes(): string[] {
    return ["composer.json"];
  }

  public async parseFile(filePath: string): Promise<PackageDependency[]> {
    try {
      const document = await vscode.workspace.openTextDocument(filePath);
      const content = document.getText();
      const dependencies: PackageDependency[] = [];

      let composerJson: ComposerJson;
      try {
        composerJson = JSON.parse(content);
      } catch (parseError) {
        throw new Error(`Invalid JSON in composer.json: ${parseError}`);
      }

      // Parse regular dependencies
      if (composerJson.require) {
        for (const [name, version] of Object.entries(composerJson.require)) {
          // Skip PHP version requirement and extensions
          if (name === "php" || name.startsWith("ext-")) {
            continue;
          }

          const dependency = this.createDependency(
            name,
            this.cleanVersion(version),
            "dependency",
            this.getEcosystem()
          );
          dependencies.push(dependency);
        }
      }

      // Parse development dependencies
      if (composerJson["require-dev"]) {
        for (const [name, version] of Object.entries(
          composerJson["require-dev"]
        )) {
          // Skip PHP version requirement and extensions
          if (name === "php" || name.startsWith("ext-")) {
            continue;
          }

          const dependency = this.createDependency(
            name,
            this.cleanVersion(version),
            "devDependency",
            this.getEcosystem()
          );
          dependencies.push(dependency);
        }
      }

      // Parse suggested dependencies as optional
      if (composerJson.suggest) {
        for (const [name, description] of Object.entries(
          composerJson.suggest
        )) {
          // Skip PHP version requirement and extensions
          if (name === "php" || name.startsWith("ext-")) {
            continue;
          }

          const dependency = this.createDependency(
            name,
            "latest", // Suggested packages don't have version constraints
            "optionalDependency",
            this.getEcosystem()
          );
          dependencies.push(dependency);
        }
      }

      // Parse conflicts as peer dependencies (they need to be considered)
      if (composerJson.conflict) {
        for (const [name, version] of Object.entries(composerJson.conflict)) {
          // Skip PHP version requirement and extensions
          if (name === "php" || name.startsWith("ext-")) {
            continue;
          }

          const dependency = this.createDependency(
            name,
            this.cleanVersion(version),
            "peerDependency",
            this.getEcosystem()
          );
          dependencies.push(dependency);
        }
      }

      return dependencies.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      throw new Error(
        `Failed to parse composer.json at ${filePath}: ${
          (error as Error).message
        }`
      );
    }
  }

  private cleanVersion(version: string): string {
    if (!version) {
      return "latest";
    }

    // Handle common Composer version constraints
    // Remove constraint operators and keep the version number
    let cleanedVersion = version.trim();

    // Remove common prefixes like ^, ~, >=, <=, >, <, !=
    cleanedVersion = cleanedVersion.replace(/^[\^~><=!]+\s*/, "");

    // Handle version ranges (take the first version)
    if (cleanedVersion.includes("||")) {
      cleanedVersion = cleanedVersion.split("||")[0].trim();
    }
    if (cleanedVersion.includes(",")) {
      cleanedVersion = cleanedVersion.split(",")[0].trim();
    }
    if (cleanedVersion.includes(" ")) {
      cleanedVersion = cleanedVersion.split(" ")[0].trim();
    }

    // Handle wildcards
    if (cleanedVersion.includes("*")) {
      cleanedVersion = cleanedVersion.replace(/\.\*$/, ".0");
    }

    // Handle dev versions
    if (cleanedVersion.includes("dev-")) {
      cleanedVersion = cleanedVersion.replace("dev-", "");
    }

    return cleanedVersion || "latest";
  }
}
