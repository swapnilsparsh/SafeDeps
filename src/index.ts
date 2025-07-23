// Core exports
export { DependencyScanner } from "./core/DependencyScanner";
export { BaseDependencyScanner } from "./core/BaseDependencyScanner";
export { DEPENDENCY_FILE_CONFIGS, EXCLUDE_PATTERNS } from "./core/config";
export { IDependencyScanner, IScanConfig } from "./core/interfaces";

// Parser exports
export {
  PackageJsonParser,
  IPackageJsonParser,
} from "./parsers/PackageJsonParser";

// Service exports
export {
  NpmRegistryService,
  INpmRegistryService,
} from "./services/NpmRegistryService";

// Provider exports
export { SafeDepsWebviewViewProvider } from "./providers/SafeDepsWebviewViewProvider";

// Command exports
export { SafeDepsCommands } from "./commands/SafeDepsCommands";

// UI exports
export { generateWebviewHtml } from "./ui/WebviewTemplate";

// Type exports
export * from "./types";
