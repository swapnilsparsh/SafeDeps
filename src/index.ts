// Core exports
export { DependencyScanner } from "./core/DependencyScanner";
export { EcosystemScanner } from "./core/EcosystemScanner";
export { BaseDependencyScanner } from "./core/BaseDependencyScanner";
export { DEPENDENCY_FILE_CONFIGS, EXCLUDE_PATTERNS } from "./core/config";
export { IDependencyScanner, IScanConfig } from "./core/interfaces";

// Parser exports
export {
  PackageJsonParser,
  IPackageJsonParser,
} from "./parsers/PackageJsonParser";
export {
  UnifiedDependencyParser,
  IUnifiedDependencyParser,
} from "./parsers/UnifiedDependencyParser";
export { BaseDependencyParser } from "./parsers/BaseDependencyParser";
export { NpmPackageParser } from "./parsers/NpmPackageParser";
export { PythonRequirementsParser } from "./parsers/PythonRequirementsParser";
export { GoModParser } from "./parsers/GoModParser";
export { CargoTomlParser } from "./parsers/CargoTomlParser";

// Service exports
export {
  NpmRegistryService,
  INpmRegistryService,
} from "./services/NpmRegistryService";
export { OsvService, IOsvService } from "./services/OsvService";

// Provider exports
export { SafeDepsWebviewViewProvider } from "./providers/SafeDepsWebviewViewProvider";

// Command exports
export { SafeDepsCommands } from "./commands/SafeDepsCommands";

// UI exports
export { generateWebviewHtml } from "./ui/WebviewTemplate";

// Type exports
export * from "./types";
