# Contributing to SafeDeps

Thank you for your interest in contributing to SafeDeps! We welcome contributions from the community and are pleased to have you join us.

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm
- VS Code 1.101.0+
- Git

### Development Setup

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/swapnilsparsh/SafeDeps.git
   cd SafeDeps
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Build the extension**

   ```bash
   npm run compile
   ```

4. **Run in development mode**
   - Open the project in VS Code
   - Press `F5` to launch Extension Development Host
   - Test your changes in the new VS Code window

## 🛠️ Development Workflow

### Project Structure

```
src/
├── commands/        # VS Code commands
├── core/            # Core scanning logic
├── parsers/         # Dependency file parsers
├── providers/       # VS Code providers
├── services/        # External service integrations
├── types/           # TypeScript type definitions
├── ui/              # WebView UI components
└── extension.ts     # Main extension entry point
```

### Available Scripts

- `npm run compile` - Build the extension
- `npm run watch` - Watch mode for development
- `npm run test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run package` - Create production build

### Code Style

We use ESLint and Prettier for code formatting. Please ensure your code passes linting:

```bash
npm run lint
```

## 📝 Adding New Features

### Adding a New Ecosystem

1. **Create a parser** in `src/parsers/`

   - Extend `BaseDependencyParser`
   - Implement file parsing logic
   - Add to `UnifiedDependencyParser`

2. **Create a registry service** in `src/services/`

   - Extend `BaseRegistryService`
   - Implement metadata fetching
   - Add to `UnifiedRegistryService`

3. **Update types** in `src/types/`

   - Add ecosystem to `DependencyEcosystem`
   - Update relevant interfaces

### Adding UI Features

1. **WebView components** go in `src/ui/`
2. **Update provider** in `src/providers/`
3. **Test with various themes** (light/dark/high contrast)

## 🐛 Bug Reports

When filing an issue, please include:

- **VS Code version**
- **Extension version**
- **Operating system**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Error messages** (if any)
- **Sample files** (if applicable)

## 💡 Feature Requests

We welcome feature requests! Please:

- Check existing issues first
- Provide clear use cases
- Explain the problem it solves
- Consider implementation complexity

## 📋 Pull Request Process

1. **Create a feature branch**

   ```bash
   git checkout -b feature/name
   ```

2. **Make your changes**

   - Write clean, documented code
   - Add tests for new functionality
   - Update documentation if needed

3. **Commit with clear messages**

   ```bash
   git commit -m "Add: Support for new package manager"
   ```

4. **Push and create PR**

   ```bash
   git push origin feature/amazing-feature
   ```

5. **Fill out the PR template**
   - Describe your changes
   - Link related issues
   - Add screenshots if applicable

### PR Requirements

- ✅ All tests pass
- ✅ Code follows style guidelines
- ✅ Documentation updated
- ✅ No breaking changes (or clearly documented)
- ✅ Commits are clear and atomic

## 🏷️ Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag
4. Build and package
5. Publish to marketplace

## 🤝 Code of Conduct

Please be respectful and professional in all interactions. We're building this together!

## 📞 Getting Help

- 💬 **Discussions**: [GitHub Discussions](https://github.com/swapnilsparsh/SafeDeps/discussions)
- 🐛 **Issues**: [GitHub Issues](https://github.com/swapnilsparsh/SafeDeps/issues)
- 📧 **Email**: [arezonalucky55@example.com](mailto:arezonalucky55@example.com)

Thank you for contributing to SafeDeps! 🎉
