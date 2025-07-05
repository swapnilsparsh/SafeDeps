import { IScanConfig } from "./interfaces";

export const DEPENDENCY_FILE_CONFIGS: readonly IScanConfig[] = [
  {
    pattern: "**/package.json",
    type: "package.json",
    language: "JavaScript/TypeScript",
  },
  {
    pattern: "**/requirements.txt",
    type: "requirements.txt",
    language: "Python",
  },
  { pattern: "**/go.mod", type: "go.mod", language: "Go" },
  { pattern: "**/Cargo.toml", type: "Cargo.toml", language: "Rust" },
  { pattern: "**/pom.xml", type: "pom.xml", language: "Java" },
  { pattern: "**/build.gradle", type: "build.gradle", language: "Java" },
  { pattern: "**/Gemfile", type: "Gemfile", language: "Ruby" },
  { pattern: "**/composer.json", type: "composer.json", language: "PHP" },
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
