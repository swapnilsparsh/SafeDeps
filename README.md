# SafeDeps - Dependency Security Scanner for VS Code

SafeDeps is a comprehensive VS Code extension that helps developers maintain secure and up-to-date dependencies across multiple programming ecosystems. It provides real-time vulnerability scanning, license compliance checking, and dependency management insights directly in your development environment.

## 🆕 What's New in v2.0

### ⚡ Performance Boost

- **Up to 50x faster** scanning with automatic `.gitignore` respect
- Excludes `node_modules/`, `.next/`, `__pycache__/`, and other build artifacts
- Smart pattern matching across all 7 ecosystems

### ⚙️ Settings UI

- New **settings panel** with ⚙️ button in the webview
- **One-click toggle** for `.gitignore` respect
- **Auto-rescan** when settings change - see immediate results

### 🔍 Advanced Search & Filter

- Real-time search with `Ctrl/Cmd+F` shortcut
- Search packages by name, version, CVE, license, or author
- Combine search with vulnerability filters

### 📊 Progress Tracking

- Real-time progress indicators during scans
- Visual progress bar with time estimates
- Detailed operation status

### 💾 State Persistence

- Scan results persist across webview reloads
- No more losing data when switching views
- Smart state restoration

[See full changelog](CHANGELOG.md)

## ✨ Features

### 🔍 **Multi-Ecosystem Support**

- **JavaScript/TypeScript** - `package.json`, `package-lock.json`
- **Python** - `requirements.txt`, `Pipfile`, `pyproject.toml`
- **Go** - `go.mod`, `go.sum`
- **Rust** - `Cargo.toml`, `Cargo.lock`
- **PHP** - `composer.json`, `composer.lock`
- **Ruby** - `Gemfile`, `Gemfile.lock`
- **Java/Kotlin** - `pom.xml`, `build.gradle`

### 🛡️ **Security & Vulnerability Scanning**

- Real-time vulnerability detection using OSV (Open Source Vulnerabilities) database
- Severity classification (Critical, High, Medium, Low)
- Detailed vulnerability information with remediation suggestions
- Continuous monitoring of new vulnerabilities

### � **Security-First Design**

- **180+ Security Patterns** - Automatically excludes sensitive files from all scans
- **Never Scans:** `.env` files, private keys, credentials, passwords, secrets, cloud configs
- **3-Layer Protection** - Pattern filtering, runtime validation, and configuration protection
- **Cannot Be Disabled** - Security exclusions are always enforced, regardless of settings
- **Verify Security** - Run `SafeDeps: Verify Security Implementation` command to check protection
- See [SECURITY.md](SECURITY.md) for complete security policy

### �📊 **Dependency Analytics**

- Package size analysis and optimization recommendations
- License compliance tracking and reporting
- Outdated dependency detection with update suggestions
- Dependency breakdown by ecosystem and type

### 🎯 **Smart Detection**

- Automatic workspace scanning for dependency files
- Intelligent ecosystem detection
- Real-time metadata fetching from official registries
- Comprehensive package information (version, license, size, last updated)

### 💡 **Developer Experience**

- **Activity Bar Integration** - Dedicated SafeDeps sidebar for quick access
- **Interactive WebView** - Modern, responsive interface with VS Code theming
- **Command Palette** - Quick actions and ecosystem-specific scanning
- **File Navigation** - Click to open dependency files directly
- **Settings Panel** - Easy-to-use ⚙️ settings button with toggle controls
- **Search & Filter** - Quickly find specific packages by name, version, CVE, or license
  - Real-time search
  - Keyboard shortcut support (Ctrl/Cmd+F)
  - Search across package names, versions, authors, licenses, and CVE IDs
  - Combine search with vulnerability filters for precise results

### ⚡ **Performance & Optimization**

- **GitIgnore Integration** - Automatically respects `.gitignore` files
  - Excludes build artifacts (`node_modules/`, `.next/`, `dist/`, etc.)
  - Skips cache directories (`__pycache__/`, `.pytest_cache/`, `.gradle/`, etc.)
  - 46+ default exclude patterns covering all ecosystems
  - Up to 50x faster scanning on large projects
- **Smart Caching** - Efficient pattern matching and file detection
- **Auto-Rescan** - Immediate feedback when changing settings

## 🚀 Getting Started

### Installation

1. Install SafeDeps from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=SwapnilSparsh.safedeps)
2. Open any project with dependency files
3. Click the SafeDeps icon in the Activity Bar to start scanning

### Quick Start

1. **Open your project** in VS Code
2. **Click the SafeDeps icon** in the Activity Bar (left sidebar)
3. **Click "Scan All Dependencies"** to analyze your entire project
4. **View results** including vulnerabilities, outdated packages, and license information
5. **Click on any dependency file** to open it directly

## 📋 Usage

### Scanning Dependencies

#### Scan All Ecosystems

```
Ctrl+Shift+P → "SafeDeps: Scan Dependencies"
```

Analyzes all dependency files across all supported ecosystems in your workspace.

#### Ecosystem-Specific Scanning

```
Ctrl+Shift+P → "SafeDeps: Scan Ecosystem Dependencies"
```

Choose a specific ecosystem (npm, Python, Go, etc.) for targeted analysis.

#### Verify Security Implementation

```
Ctrl+Shift+P → "SafeDeps: Verify Security Implementation"
```

Displays security status confirming that 180+ security patterns are active and sensitive files are protected.

### ⚙️ Using Settings

#### Accessing Settings

1. **Click the ⚙️ button** in the top-right corner of the SafeDeps view
2. Settings panel slides down with available options
3. Toggle settings on/off with one click
4. Changes take effect immediately with automatic rescan

#### Available Settings in UI

**Respect .gitignore files**

- Toggle to enable/disable `.gitignore` respect
- When enabled (recommended):
  - Excludes build artifacts and cache directories
  - Scans only relevant dependency files
  - Dramatically faster performance
- When disabled:
  - Scans all directories
  - Useful for debugging or legacy projects

### Understanding Results

#### 🚨 Vulnerability Indicators

- **Critical** - Immediate action required
- **High** - Should be addressed soon
- **Medium** - Consider updating when convenient
- **Low** - Minor security concerns

#### 📅 Outdated Packages

- Packages with newer versions available
- Update recommendations with version information

#### 📄 License Compliance

- Unknown licenses flagged for review
- License information for compliance tracking

### 🔍 Search & Filter

#### Quick Search

Use the search box in the results view to find specific packages:

- **Press `Ctrl/Cmd+F`** to focus the search input
- Type package name, version, or CVE ID
- See real-time results with highlighted matches
- **Press `Esc`** to clear search

#### Search Capabilities

- **Package Names** - Find packages by name (e.g., "react", "lodash")
- **Versions** - Search by version numbers (e.g., "1.2.3")
- **Authors** - Find packages by author name
- **Licenses** - Search by license type (e.g., "MIT", "Apache")
- **CVE IDs** - Search for specific vulnerabilities (e.g., "CVE-2023-12345")

#### Combining Filters

Apply multiple filters simultaneously:

1. Select a vulnerability filter (e.g., "Critical")
2. Use search to find specific package names
3. Results show only packages matching both criteria

## ⚙️ Configuration

SafeDeps works out of the box with no configuration required, but offers powerful customization options:

### Settings

Access settings via:

- Click the **⚙️ button** in the SafeDeps webview header
- Or use VS Code settings: `Ctrl+,` → Search "SafeDeps"

#### Available Settings

**`safedeps.respectGitignore`** (default: `true`)

- Automatically respect `.gitignore` files when scanning
- Excludes build artifacts, cache directories, and ignored files
- Dramatically improves scan performance
- **Toggle directly from the Settings UI** - Changes trigger automatic rescan
- **Note:** Security-sensitive files (`.env`, keys, credentials) are ALWAYS excluded regardless of this setting

**`safedeps.additionalExcludePatterns`** (default: `[]`)

- Add custom glob patterns to exclude from scans
- Example: `["**/custom-build/**", "**/temp-files/**"]`
- Combined with default patterns and `.gitignore` patterns
- **Note:** Cannot be used to override security exclusions (negation patterns like `!.env` are blocked)

**`safedeps.autoScanOnOpen`** (default: `true`)

- Automatically scan dependencies when the SafeDeps view is opened

### Example Configuration

```json
{
  "safedeps.respectGitignore": true,
  "safedeps.additionalExcludePatterns": ["**/custom-dir/**", "**/.my-cache/**"],
  "safedeps.autoScanOnOpen": true
}
```

### Default Exclude Patterns

When `.gitignore` respect is enabled, SafeDeps automatically excludes:

**Node.js/JavaScript/TypeScript**

- `node_modules/`, `.next/`, `.nuxt/`, `dist/`, `build/`, `.cache/`, `.parcel-cache/`, `.turbo/`

**Python**

- `venv/`, `.venv/`, `__pycache__/`, `.pytest_cache/`, `.tox/`, `.eggs/`

**Java/Maven/Gradle**

- `target/`, `.gradle/`, `build/`, `.idea/`, `classes/`, `bin/`

**Ruby**

- `vendor/bundle/`, `.bundle/`

**PHP**

- `vendor/`

**Go**

- `vendor/`

**Rust**

- `target/`

**General**

- `.git/`, `tmp/`, `temp/`, `.DS_Store/`

### Auto-Rescan on Setting Change

When you toggle the `.gitignore` respect setting:

1. Setting is saved immediately
2. Cache is cleared automatically
3. **Scan re-runs automatically** with new settings
4. Results update to show the impact of your change

No need to manually click "Scan Workspace" - just toggle and see the results!

## 🔧 Supported Registries

- **npm** - Node.js packages
- **PyPI** - Python packages
- **Go Proxy** - Go modules
- **Crates.io** - Rust packages
- **Packagist** - PHP packages
- **RubyGems** - Ruby gems
- **Maven Central** - Java/Kotlin packages

## 📊 Example Output

```
📦 Found 42 dependencies across 3 ecosystems

JavaScript (package.json):
├── 🚨 2 vulnerable packages
├── 📅 5 outdated packages
└── 📄 1 unknown license

Python (requirements.txt):
├── ✅ No vulnerabilities
├── 📅 3 outdated packages
└── ✅ All licenses known

Go (go.mod):
├── ✅ No vulnerabilities
├── ✅ All packages up to date
└── ✅ All licenses known
```

## 🎯 Commands

| Command                                 | Description                                 |
| --------------------------------------- | ------------------------------------------- |
| `SafeDeps: Scan Dependencies`           | Scan all dependency files in workspace      |
| `SafeDeps: Scan Ecosystem Dependencies` | Scan specific ecosystem (npm, Python, etc.) |

## 📋 Requirements

- **VS Code** 1.57.0 or higher
- **Internet connection** for vulnerability and metadata fetching
- **Dependency files** in your workspace (package.json, requirements.txt, etc.)

## ❓ FAQ

### Why is my scan so much faster in v2.0?

SafeDeps v2.0 automatically respects `.gitignore` files, excluding build artifacts like `node_modules/`, `.next/`, `__pycache__/`, etc. This can reduce scans from 100,000+ files to just a handful of dependency manifests!

### How do I disable .gitignore respect?

Click the **⚙️ button** in the SafeDeps view, then toggle off "Respect .gitignore files". The workspace will automatically rescan with the new setting.

### What directories are excluded by default?

SafeDeps excludes 46+ common patterns including:

- Node.js: `node_modules/`, `.next/`, `.nuxt/`, `dist/`, `build/`
- Python: `__pycache__/`, `.venv/`, `.pytest_cache/`
- Java: `target/`, `.gradle/`
- And many more across all ecosystems

### Can I add custom exclude patterns?

Yes! Add to your VS Code settings:

```json
{
  "safedeps.additionalExcludePatterns": ["**/my-custom-dir/**"]
}
```

### Why don't I see certain dependency files?

Check if they're in your `.gitignore`. If so, either remove them from `.gitignore` or disable "Respect .gitignore files" in SafeDeps settings.

### Do settings changes require manual rescan?

No! When you toggle settings in the Settings UI, SafeDeps automatically rescans with the new configuration. Just toggle and see the results update immediately.

## 🐛 Known Issues

- Large projects with 1000+ dependencies may take longer to scan (even with optimizations)
- Some private registries are not supported yet
- Network timeouts may occur with slow internet connections

## 🚀 Roadmap

- [ ] Support for more ecosystems (Dart, Swift, etc.)
- [ ] Private registry support
- [ ] Custom vulnerability rules
- [ ] Dependency update automation
- [ ] Workspace-specific settings override
- [ ] Pattern debugging tool

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed version history and release notes.

---

✨ More to come soon!

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This extension is licensed under the [MIT License](LICENSE).

## 🆘 Support

- 📧 **Issues**: [GitHub Issues](https://github.com/swapnilsparsh/SafeDeps/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/swapnilsparsh/SafeDeps/discussions)
- 🐦 **Twitter**: [@swapnilsparsh](https://twitter.com/swapnilsparsh)

---

**Enjoy safer dependency management with SafeDeps!** 🛡️
