# Security Policy

## Security-First Design

SafeDeps is designed with security as a top priority. The extension scans dependency files to identify vulnerabilities, but it's equally important that SafeDeps itself never exposes or processes sensitive user data.

## Automatic Security Exclusions

SafeDeps **automatically and permanently excludes** security-sensitive files from all scanning operations. These exclusions **cannot be disabled** by any configuration setting.

### Always Excluded Files

The following types of files are **always excluded** from scanning:

#### Environment & Configuration Files

- `.env`, `.env.*`, `.envrc`
- `env.local`, `env.*.local`
- `config.local.*`, `local.settings.json`
- Any file containing environment variables or local configuration

#### Credentials & Authentication

- Cloud provider credentials (AWS, Azure, GCP, Firebase)
- SSH keys (`id_rsa`, `id_dsa`, `id_ecdsa`, `id_ed25519`)
- API keys, tokens, passwords
- `.netrc`, `.npmrc`, `.pypirc`, `.gem/credentials`
- Authentication configuration files

#### Private Keys & Certificates

- `*.key`, `*.pem`, `*.pfx`, `*.p12`, `*.jks`
- SSL/TLS certificates
- Keystores and keychains
- GPG keys

#### Secrets Management

- Vault tokens, secret stores
- Password files
- Docker and Kubernetes secrets
- CI/CD configuration with secrets

#### Database & Backups

- Database dumps (`*.sql`, `*.db`, `*.sqlite`)
- Backup files (`*.bak`, `*.backup`)
- Any files that may contain sensitive data

#### Logs & History

- Log files that may contain sensitive command history
- Shell history files (`.bash_history`, `.zsh_history`)
- REPL history

#### Infrastructure as Code

- Terraform state files (`*.tfstate`)
- Terraform variable files with secrets (`*.tfvars`)

## Configuration Options

### `safedeps.respectGitignore` (Default: `true`)

When enabled, SafeDeps respects `.gitignore` files in your workspace for build artifacts and cache directories.

**Important:** This setting does **NOT** affect security exclusions. Security-sensitive files are **always excluded** regardless of this setting.

### `safedeps.additionalExcludePatterns` (Default: `[]`)

Add custom glob patterns to exclude additional directories or files from scanning.

**Important:** This setting **cannot** be used to override security exclusions. Any negation patterns (e.g., `!.env`) will be ignored with a warning.

## Defense in Depth

SafeDeps implements multiple layers of security:

1. **Pattern-Based Exclusion**: Security patterns are applied first, before any other exclusion logic
2. **Defensive Validation**: Additional runtime checks ensure no security-sensitive files slip through
3. **Logging & Monitoring**: Suspicious access attempts are logged for debugging
4. **Immutable Security**: Security patterns cannot be disabled or overridden by configuration

## Code Flow

```
Scan Request
    ↓
[Apply Security Patterns] ← ALWAYS APPLIED, CANNOT BE DISABLED
    ↓
[Apply Default Build Patterns] ← Always applied
    ↓
[Apply .gitignore Patterns] ← Optional (respectGitignore setting)
    ↓
[Apply Additional User Patterns] ← Optional, validated
    ↓
[Defensive Runtime Check] ← Extra validation before parsing
    ↓
Parse Dependency Files
```

## Reporting Security Issues

If you discover a security vulnerability in SafeDeps, please report it to:

- **Email**: arezonalucky55@gmail.com
- **GitHub**: https://github.com/swapnilsparsh/SafeDeps/security/advisories

Please **do not** disclose security vulnerabilities publicly until we've had a chance to address them.

## Security Guarantees

SafeDeps guarantees that:

1. ✅ Security-sensitive files are **never scanned** under any circumstances
2. ✅ User credentials and secrets are **never transmitted** over the network
3. ✅ All vulnerability checks use public APIs with no authentication required
4. ✅ No file contents are uploaded to external services
5. ✅ Security exclusions **cannot be disabled** by configuration

## Audit Information

- **Last Security Review**: January 2026
- **Security Patterns Count**: 180+ patterns
- **Defense Layers**: 3 (Pattern filtering, Runtime validation, Configuration validation)

## Questions?

If you have questions about SafeDeps' security measures, please open an issue on our [GitHub repository](https://github.com/swapnilsparsh/SafeDeps).
