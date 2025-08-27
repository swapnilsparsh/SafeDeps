import { DependencyFile, PackageDependency } from "../types";
import { NpmPackageParser } from "./NpmPackageParser";
import { PythonRequirementsParser } from "./PythonRequirementsParser";
import { GoModParser } from "./GoModParser";
import { CargoTomlParser } from "./CargoTomlParser";
import { PomXmlParser } from "./PomXmlParser";
import { BuildGradleParser } from "./BuildGradleParser";
import { GemfileParser } from "./GemfileParser";
import { ComposerJsonParser } from "./ComposerJsonParser";
import { BaseDependencyParser } from "./BaseDependencyParser";

export interface IUnifiedDependencyParser {
  parseFile(dependencyFile: DependencyFile): Promise<PackageDependency[]>;
  getSupportedEcosystems(): string[];
}

export class UnifiedDependencyParser implements IUnifiedDependencyParser {
  private parsers: Map<string, BaseDependencyParser>;

  constructor() {
    this.parsers = new Map();

    this.parsers.set("package.json", new NpmPackageParser());
    this.parsers.set("requirements.txt", new PythonRequirementsParser());
    this.parsers.set("go.mod", new GoModParser());
    this.parsers.set("Cargo.toml", new CargoTomlParser());
    this.parsers.set("pom.xml", new PomXmlParser());
    this.parsers.set("build.gradle", new BuildGradleParser());
    this.parsers.set("Gemfile", new GemfileParser());
    this.parsers.set("composer.json", new ComposerJsonParser());
  }

  public async parseFile(
    dependencyFile: DependencyFile
  ): Promise<PackageDependency[]> {
    const parser = this.parsers.get(dependencyFile.type);

    if (!parser) {
      throw new Error(
        `No parser available for file type: ${dependencyFile.type}`
      );
    }

    try {
      const dependencies = await parser.parseFile(dependencyFile.filePath);

      return dependencies.map((dep) => ({
        ...dep,
        ecosystem: dependencyFile.ecosystem,
      }));
    } catch (error) {
      console.error(
        `Error parsing ${dependencyFile.type} file ${dependencyFile.filePath}:`,
        error
      );
      return [];
    }
  }

  public getSupportedEcosystems(): string[] {
    const ecosystems = new Set<string>();
    for (const parser of this.parsers.values()) {
      ecosystems.add(parser.getEcosystem());
    }
    return Array.from(ecosystems);
  }

  public getParserForFileType(
    fileType: string
  ): BaseDependencyParser | undefined {
    return this.parsers.get(fileType);
  }

  public addParser(fileType: string, parser: BaseDependencyParser): void {
    this.parsers.set(fileType, parser);
  }
}
