import { PackageDependency } from "../types";

export interface IDependencyParser {
  parseFile(filePath: string): Promise<PackageDependency[]>;
  getEcosystem(): string;
  getSupportedFileTypes(): string[];
}

export abstract class BaseDependencyParser implements IDependencyParser {
  abstract parseFile(filePath: string): Promise<PackageDependency[]>;
  abstract getEcosystem(): string;
  abstract getSupportedFileTypes(): string[];

  protected createDependency(
    name: string,
    version: string,
    type: PackageDependency["type"],
    ecosystem: string
  ): PackageDependency {
    return {
      name,
      version,
      type,
      ecosystem,
    };
  }
}
