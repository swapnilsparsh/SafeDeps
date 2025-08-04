import { IScanConfig } from "./interfaces";

export const DEPENDENCY_FILE_CONFIGS: readonly IScanConfig[] = [
  {
    pattern: "**/package.json",
    type: "package.json",
    language: "JavaScript/TypeScript",
    ecosystem: "npm",
  },
  {
    pattern: "**/requirements.txt",
    type: "requirements.txt",
    language: "Python",
    ecosystem: "PyPI",
  },
  {
    pattern: "**/go.mod",
    type: "go.mod",
    language: "Go",
    ecosystem: "Go",
  },
  {
    pattern: "**/Cargo.toml",
    type: "Cargo.toml",
    language: "Rust",
    ecosystem: "crates.io",
  },
  {
    pattern: "**/pom.xml",
    type: "pom.xml",
    language: "Java",
    ecosystem: "Maven",
  },
  {
    pattern: "**/build.gradle",
    type: "build.gradle",
    language: "Java",
    ecosystem: "Maven",
  },
  {
    pattern: "**/Gemfile",
    type: "Gemfile",
    language: "Ruby",
    ecosystem: "RubyGems",
  },
  {
    pattern: "**/composer.json",
    type: "composer.json",
    language: "PHP",
    ecosystem: "Packagist",
  },
] as const;

export const EXCLUDE_PATTERNS = [
  "**/node_modules/**",
  "**/venv/**",
  "**/env/**",
  "**/.venv/**",
  "**/target/**",
  "**/build/**",
  "**/dist/**",
] as const;
