import * as vscode from "vscode";
import { PackageDependency } from "../types";
import { BaseDependencyParser } from "./BaseDependencyParser";

export interface IPomXmlParser {
  parseFile(filePath: string): Promise<PackageDependency[]>;
}

export class PomXmlParser
  extends BaseDependencyParser
  implements IPomXmlParser
{
  public getEcosystem(): string {
    return "Maven";
  }

  public getSupportedFileTypes(): string[] {
    return ["pom.xml"];
  }

  public async parseFile(filePath: string): Promise<PackageDependency[]> {
    try {
      const document = await vscode.workspace.openTextDocument(filePath);
      const content = document.getText();
      const dependencies: PackageDependency[] = [];

      // Parse XML content to extract dependencies
      const dependencyRegex =
        /<dependency>\s*<groupId>([^<]+)<\/groupId>\s*<artifactId>([^<]+)<\/artifactId>\s*<version>([^<]*)<\/version>(?:\s*<scope>([^<]*)<\/scope>)?\s*<\/dependency>/gs;

      let match;
      while ((match = dependencyRegex.exec(content)) !== null) {
        const [, groupId, artifactId, version, scope] = match;

        if (groupId && artifactId) {
          const dependency = this.createDependency(
            `${groupId.trim()}:${artifactId.trim()}`,
            version?.trim() || "latest",
            this.mapScopeToType(scope?.trim()),
            this.getEcosystem()
          );

          dependencies.push(dependency);
        }
      }

      // Also check for dependency management section
      const dependencyManagementRegex =
        /<dependencyManagement>.*?<dependencies>(.*?)<\/dependencies>.*?<\/dependencyManagement>/gs;
      const managementMatch = dependencyManagementRegex.exec(content);

      if (managementMatch) {
        const managementContent = managementMatch[1];
        let depMatch;

        while ((depMatch = dependencyRegex.exec(managementContent)) !== null) {
          const [, groupId, artifactId, version, scope] = depMatch;

          if (groupId && artifactId) {
            const dependency = this.createDependency(
              `${groupId.trim()}:${artifactId.trim()}`,
              version?.trim() || "latest",
              this.mapScopeToType(scope?.trim()),
              this.getEcosystem()
            );

            // Avoid duplicates
            const exists = dependencies.some((d) => d.name === dependency.name);
            if (!exists) {
              dependencies.push(dependency);
            }
          }
        }
      }

      return dependencies.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      throw new Error(
        `Failed to parse pom.xml at ${filePath}: ${(error as Error).message}`
      );
    }
  }

  private mapScopeToType(scope?: string): PackageDependency["type"] {
    if (!scope) {
      return "dependency";
    }

    switch (scope.toLowerCase()) {
      case "test":
        return "devDependency";
      case "provided":
      case "system":
        return "peerDependency";
      case "runtime":
      case "compile":
      default:
        return "dependency";
    }
  }
}
