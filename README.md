# SafeDeps - Dependency Security Scanner for VS Code

SafeDeps is a comprehensive VS Code extension that helps developers maintain secure and up-to-date dependencies across multiple programming ecosystems. It provides real-time vulnerability scanning, license compliance checking, and dependency management insights directly in your development environment.

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

### 📊 **Dependency Analytics**

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

## 🚀 Getting Started

### Installation

1. Install SafeDeps from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=your-publisher.safedeps)
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

## ⚙️ Configuration

SafeDeps works out of the box with no configuration required. The extension automatically:

- Detects dependency files in your workspace
- Fetches metadata from official package registries
- Scans for vulnerabilities using the OSV database
- Updates information in real-time

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

- **VS Code** 1.101.0 or higher
- **Internet connection** for vulnerability and metadata fetching
- **Dependency files** in your workspace (package.json, requirements.txt, etc.)

## 🐛 Known Issues

- Large projects with 1000+ dependencies may take longer to scan
- Some private registries are not supported yet
- Network timeouts may occur with slow internet connections

## 🚀 Roadmap

- [ ] Support for more ecosystems (Dart, Swift, etc.)
- [ ] Private registry support
- [ ] Custom vulnerability rules
- [ ] Dependency update automation

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
