# Change Log

All notable changes to the SafeDeps extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-11-07

### 🎉 Major Update - Performance, Search, and UX Improvements

#### ✨ New Features

- **GitIgnore Integration** (Latest Addition)

  - Automatically respects `.gitignore` files when scanning for dependencies
  - Excludes build artifacts, cache directories, and ignored files from scans
  - Dramatically improves scan performance (up to 50x faster on large projects)
  - Supports multiple `.gitignore` files across workspace
  - 46+ default exclude patterns covering all ecosystems:
    - Node.js: `node_modules/`, `.next/`, `.nuxt/`, `.cache/`, `.turbo/`, etc.
    - Python: `__pycache__/`, `.venv/`, `.pytest_cache/`, `.tox/`, etc.
    - Java/Maven: `target/`, `.gradle/`, `build/`, etc.
    - Ruby: `vendor/bundle/`, `.bundle/`
    - PHP: `vendor/`
    - Go: `vendor/`
    - Rust: `target/`

- **Settings UI** (Latest Addition)

  - New settings panel with ⚙️ button in webview header
  - Modern iOS-style toggle for `.gitignore` respect setting
  - **Auto-rescan on toggle** - Immediate feedback when changing settings
  - Visual notifications for setting changes
  - Persistent state across sessions
  - Keyboard accessible and screen reader friendly

- **Advanced Search & Filter**

  - Real-time package search with `Ctrl/Cmd+F` keyboard shortcut
  - Search across package names, versions, authors, licenses, and CVE IDs
  - Highlight matching text in results
  - Combine search with vulnerability filters for precise results
  - Search results counter showing matching packages
  - Clear search with `Esc` key

- **Progress Tracking**

  - Real-time progress indicators during scans
  - Visual progress bar with percentage and time estimates
  - Detailed progress messages showing current operation
  - Elapsed time and estimated time remaining
  - Smooth animations and transitions

- **State Persistence**

  - Scan results persist across webview reloads
  - Loading state saved and restored
  - Filter and search state preserved
  - Prevents data loss when switching views
  - Smart timeout detection for stale loading states

- **Auto-Scan on Open**
  - Automatically triggers scan when SafeDeps view opens
  - Configurable via `safedeps.autoScanOnOpen` setting (default: enabled)
  - Improves user experience with instant results

#### 🚀 Performance Improvements

- **Intelligent Scanning**

  - Skip scanning `node_modules/`, `.next/`, `dist/`, `build/`, and other build artifacts
  - Automatic cache clearing when settings change
  - Smart pattern matching for faster file detection
  - Reduced scan time from minutes to seconds on large projects

- **Better Defaults**

  - `.gitignore` respect enabled by default for optimal performance
  - Comprehensive exclude patterns work out-of-the-box
  - No configuration needed for most projects

- **Enhanced Metadata Fetching**
  - Improved registry service implementations for all ecosystems
  - Better error handling and fallback mechanisms
  - More reliable size and license information
  - Optimized API calls with proper error boundaries

#### 💡 User Experience

- **Interactive UI Elements**

  - One-click settings toggle with immediate effect
  - Settings panel slides down with smooth animations
  - Clear descriptions and visual feedback
  - Auto-rescan triggered when toggle changes (no manual rescan needed)

- **Visual Feedback**

  - Notification on setting change: "✓ .gitignore respect enabled - Rescanning..."
  - Smooth animations and transitions
  - Professional VS Code-themed interface
  - Progress indicators with real-time updates

- **Smart Rescan**

  - Automatically re-runs the last scan type when settings change
  - Preserves scan context (workspace, ecosystem, or all ecosystems)
  - Shows immediate impact of setting changes

- **Improved Navigation**
  - Package names are clickable links to registry pages
  - Direct navigation to npm, PyPI, Maven, crates.io, etc.
  - Opens in external browser for detailed package information

#### 🔧 Enhanced Configuration

- **New Settings**
  - `safedeps.respectGitignore` - Enable/disable `.gitignore` respect (default: `true`)
  - `safedeps.additionalExcludePatterns` - Add custom exclude patterns
  - `safedeps.autoScanOnOpen` - Auto-scan when view opens (default: `true`)
  - Settings accessible both via UI and VS Code settings

#### 🐛 Bug Fixes

- Fixed configuration key case mismatch (`safedeps` vs `safeDeps`)
- Fixed size and license metadata not showing for all ecosystems
- Fixed single ecosystem button functionality
- Improved error handling for missing `.gitignore` files
- Better handling of first-time extension usage
- Fixed filter functionality and data parsing issues
- Improved loading state management

#### 🔨 Technical Improvements

- **GitIgnoreService**

  - Parses `.gitignore` files with proper glob pattern conversion
  - Caches parsed patterns for performance
  - Handles multiple `.gitignore` files at different directory levels
  - Supports both absolute and relative patterns

- **State Management**

  - Three-layer state persistence (VS Code config, webview state, runtime)
  - Proper synchronization between UI and configuration
  - Handles first-time users with sensible defaults
  - Smart state restoration on webview reload

- **Progress Reporting System**

  - Comprehensive ProgressReporter and ProgressTypes
  - Callback-based progress updates
  - Time tracking and estimation
  - Detailed operation status tracking

- **Improved Registry Services**

  - Enhanced NpmRegistryService with better metadata extraction
  - Improved MavenRegistryService for Java/Kotlin packages
  - Better PackagistRegistryService for PHP packages
  - Enhanced RubyGemsRegistryService with size information
  - More reliable GoRegistryService and CratesRegistryService

- **Configuration Keys**
  - Fixed case consistency: `safedeps.*` (all lowercase)
  - Properly registered in `package.json`
  - Works with VS Code settings UI and JSON

#### 📚 Documentation

- Comprehensive GitIgnore integration guide
- Settings UI implementation details
- Visual design reference
- Real-world examples for all ecosystems
- Migration guide from v1.x
- Updated README with new features
- Detailed FAQ section

### 🔄 Breaking Changes

None - Fully backward compatible with v1.x. The new `.gitignore` respect feature is enabled by default but can be disabled if needed.

### 📋 Notes

This major update focuses on performance, search functionality, and user experience. The GitIgnore integration dramatically reduces scan times while maintaining accuracy. The new Settings UI makes configuration intuitive and accessible. Advanced search and filter capabilities help users quickly find specific packages and vulnerabilities.

---

## [1.1.0] - 2024-XX-XX

### ✨ Features Added

- **Clickable Package Names**
  - Package names now link to their respective registry pages
  - Opens npm, PyPI, Maven Central, crates.io, etc. in browser
  - Easy access to detailed package documentation

### 🔧 Improvements

- **VS Code Compatibility**
  - Lowered minimum VS Code version requirement to support older versions
  - Broader compatibility across VS Code installations

### 🐛 Bug Fixes

- Fixed single ecosystem button functionality
- Improved ecosystem-specific scanning reliability

---

## [1.0.1] - 2024-XX-XX

### 🎨 Improvements

- **Icon Update**
  - New, more polished extension icon
  - Better visibility in VS Code marketplace and activity bar

### 📚 Documentation

- Updated README with clearer instructions
- Fixed documentation links

---

## [1.0.0] - 2025-09-01

### 🎉 Initial Release

#### ✨ Features Added

- **Multi-Ecosystem Support**: Comprehensive dependency scanning for 7+ programming ecosystems

  - JavaScript/TypeScript (npm)
  - Python (PyPI)
  - Go (Go modules)
  - Rust (Crates.io)
  - PHP (Packagist)
  - Ruby (RubyGems)
  - Java/Kotlin (Maven)

- **Security & Vulnerability Scanning**

  - Real-time vulnerability detection using OSV database
  - Severity classification (Critical, High, Medium, Low)
  - Detailed vulnerability information with remediation guidance

- **Dependency Analytics**

  - Package size analysis and optimization recommendations
  - License compliance tracking and reporting
  - Outdated dependency detection with update suggestions
  - Comprehensive metadata from official registries

- **User Experience**

  - Dedicated Activity Bar integration with custom icon
  - Interactive WebView with modern VS Code theming
  - Command Palette integration for quick actions
  - One-click file navigation to dependency files

- **Smart Detection**
  - Automatic workspace scanning for dependency files
  - Intelligent ecosystem detection and parsing
  - Real-time metadata fetching from registries
  - Robust error handling and fallback mechanisms

#### 🔧 Technical Implementation

- TypeScript-based architecture with modular design
- Unified registry service supporting multiple package managers
- Efficient caching for improved performance
- Comprehensive test coverage
- Production-ready build pipeline with esbuild

#### 📦 Supported File Types

- `package.json`, `package-lock.json` (JavaScript/TypeScript)
- `requirements.txt`, `Pipfile`, `pyproject.toml` (Python)
- `go.mod`, `go.sum` (Go)
- `Cargo.toml`, `Cargo.lock` (Rust)
- `composer.json`, `composer.lock` (PHP)
- `Gemfile`, `Gemfile.lock` (Ruby)
- `pom.xml`, `build.gradle` (Java/Kotlin)

#### 🛡️ Security Features

- OSV vulnerability database integration
- Real-time security advisory monitoring
- License compliance verification
- Package authenticity checking

### 📋 Notes

This is the initial stable release of SafeDeps, providing a solid foundation for dependency security management in VS Code. Future releases will expand ecosystem support and add advanced features based on community feedback.
