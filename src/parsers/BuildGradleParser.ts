import * as vscode from "vscode";
import { PackageDependency } from "../types";
import { BaseDependencyParser } from "./BaseDependencyParser";

export interface IBuildGradleParser {
  parseFile(filePath: string): Promise<PackageDependency[]>;
}

export class BuildGradleParser
  extends BaseDependencyParser
  implements IBuildGradleParser
{
  public getEcosystem(): string {
    return "Maven";
  }

  public getSupportedFileTypes(): string[] {
    return ["build.gradle"];
  }

  public async parseFile(filePath: string): Promise<PackageDependency[]> {
    try {
      const document = await vscode.workspace.openTextDocument(filePath);
      const content = document.getText();
      const dependencies: PackageDependency[] = [];

      // Parse Gradle dependencies
      // Handle various Gradle dependency declaration formats
      const dependencyPatterns = [
        // implementation 'group:artifact:version'
        /(?:implementation|api|compile|testImplementation|testCompile|runtimeOnly|compileOnly)\s+['"]([\w\.-]+):([\w\.-]+):([\w\.-]+)['"][\s\S]*?(?=\n|$)/g,
        // implementation group: 'group', name: 'artifact', version: 'version'
        /(?:implementation|api|compile|testImplementation|testCompile|runtimeOnly|compileOnly)\s+group:\s*['"]([\w\.-]+)['"],\s*name:\s*['"]([\w\.-]+)['"],\s*version:\s*['"]([\w\.-]+)['"][\s\S]*?(?=\n|$)/g,
      ];

      for (const pattern of dependencyPatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const [fullMatch, groupId, artifactId, version] = match;

          if (groupId && artifactId && version) {
            const configType = this.extractConfigurationType(fullMatch);
            const dependency = this.createDependency(
              `${groupId.trim()}:${artifactId.trim()}`,
              version.trim(),
              this.mapConfigurationToType(configType),
              this.getEcosystem()
            );

            dependencies.push(dependency);
          }
        }
      }

      // Handle dependencies block
      const dependenciesBlockRegex = /dependencies\s*\{([\s\S]*?)\}/g;
      const blockMatch = dependenciesBlockRegex.exec(content);

      if (blockMatch) {
        const blockContent = blockMatch[1];

        // More flexible pattern for dependencies inside block
        const innerDependencyRegex =
          /(implementation|api|compile|testImplementation|testCompile|runtimeOnly|compileOnly)\s+['"]([\w\.-]+):([\w\.-]+):([\w\.-]+)['"](?:\s*{[^}]*})?/g;

        let innerMatch;
        while (
          (innerMatch = innerDependencyRegex.exec(blockContent)) !== null
        ) {
          const [fullMatch, configType, groupId, artifactId, version] =
            innerMatch;

          if (groupId && artifactId && version) {
            const dependency = this.createDependency(
              `${groupId.trim()}:${artifactId.trim()}`,
              version.trim(),
              this.mapConfigurationToType(configType),
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
        `Failed to parse build.gradle at ${filePath}: ${
          (error as Error).message
        }`
      );
    }
  }

  private extractConfigurationType(fullMatch: string): string {
    const configMatch = fullMatch.match(
      /^(implementation|api|compile|testImplementation|testCompile|runtimeOnly|compileOnly)/
    );
    return configMatch ? configMatch[1] : "implementation";
  }

  private mapConfigurationToType(
    configuration: string
  ): PackageDependency["type"] {
    switch (configuration.toLowerCase()) {
      case "testimplementation":
      case "testcompile":
        return "devDependency";
      case "compileonly":
      case "runtimeonly":
        return "peerDependency";
      case "implementation":
      case "api":
      case "compile":
      default:
        return "dependency";
    }
  }
}
