import * as vscode from "vscode";
import { PackageDependency } from "../types";
import { BaseDependencyParser } from "./BaseDependencyParser";

export interface ICargoTomlParser {
  parseFile(filePath: string): Promise<PackageDependency[]>;
}

export class CargoTomlParser
  extends BaseDependencyParser
  implements ICargoTomlParser
{
  public getEcosystem(): string {
    return "crates.io";
  }

  public getSupportedFileTypes(): string[] {
    return ["Cargo.toml"];
  }

  public async parseFile(filePath: string): Promise<PackageDependency[]> {
    try {
      const document = await vscode.workspace.openTextDocument(filePath);
      const content = document.getText();
      const dependencies: PackageDependency[] = [];

      const sections = this.parseTomlSections(content);

      if (sections.dependencies) {
        const deps = this.parseDependencySection(
          sections.dependencies,
          "dependency"
        );
        dependencies.push(...deps);
      }

      if (sections["dev-dependencies"]) {
        const deps = this.parseDependencySection(
          sections["dev-dependencies"],
          "devDependency"
        );
        dependencies.push(...deps);
      }

      if (sections["build-dependencies"]) {
        const deps = this.parseDependencySection(
          sections["build-dependencies"],
          "devDependency"
        );
        dependencies.push(...deps);
      }

      return dependencies.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      throw new Error(
        `Failed to parse Cargo.toml at ${filePath}: ${(error as Error).message}`
      );
    }
  }

  private parseTomlSections(content: string): Record<string, string> {
    const sections: Record<string, string> = {};
    const lines = content.split("\n");
    let currentSection = "";
    let currentSectionContent = "";

    for (const line of lines) {
      const trimmedLine = line.trim();

      const sectionMatch = trimmedLine.match(/^\[([^\]]+)\]$/);
      if (sectionMatch) {
        if (currentSection && currentSectionContent) {
          sections[currentSection] = currentSectionContent.trim();
        }

        currentSection = sectionMatch[1];
        currentSectionContent = "";
      } else if (currentSection) {
        currentSectionContent += line + "\n";
      }
    }

    if (currentSection && currentSectionContent) {
      sections[currentSection] = currentSectionContent.trim();
    }

    return sections;
  }

  private parseDependencySection(
    sectionContent: string,
    dependencyType: PackageDependency["type"]
  ): PackageDependency[] {
    const dependencies: PackageDependency[] = [];
    const lines = sectionContent.split("\n");

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith("#")) {
        continue;
      }

      const dependency = this.parseDependencyLine(trimmedLine, dependencyType);
      if (dependency) {
        dependencies.push(dependency);
      }
    }

    return dependencies;
  }

  private parseDependencyLine(
    line: string,
    dependencyType: PackageDependency["type"]
  ): PackageDependency | null {
    const simpleMatch = line.match(/^([a-zA-Z0-9\-_]+)\s*=\s*"([^"]+)"$/);
    if (simpleMatch) {
      const [, name, version] = simpleMatch;
      return this.createDependency(
        name.trim(),
        version.trim(),
        dependencyType,
        this.getEcosystem()
      );
    }

    const complexMatch = line.match(/^([a-zA-Z0-9\-_]+)\s*=\s*{([^}]+)}/);
    if (complexMatch) {
      const [, name, configStr] = complexMatch;

      const versionMatch = configStr.match(/version\s*=\s*"([^"]+)"/);
      if (versionMatch) {
        const version = versionMatch[1];
        return this.createDependency(
          name.trim(),
          version.trim(),
          dependencyType,
          this.getEcosystem()
        );
      }

      const gitMatch = configStr.match(/git\s*=\s*"([^"]+)"/);
      if (gitMatch) {
        return this.createDependency(
          name.trim(),
          "git",
          dependencyType,
          this.getEcosystem()
        );
      }
    }

    return null;
  }
}
