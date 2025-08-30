import * as vscode from "vscode";
import { DependencyScanner } from "../core/DependencyScanner";
import { EcosystemScanner } from "../core/EcosystemScanner";
import { DependencyEcosystem } from "../types";

export class SafeDepsCommands {
  private _dependencyScanner: DependencyScanner;
  private _ecosystemScanner: EcosystemScanner;

  constructor() {
    this._dependencyScanner = new DependencyScanner();
    this._ecosystemScanner = new EcosystemScanner();
  }

  public registerCommands(context: vscode.ExtensionContext): void {
    const commands = [
      vscode.commands.registerCommand(
        "safedeps.helloWorld",
        this.helloWorld.bind(this)
      ),
      vscode.commands.registerCommand(
        "safedeps.scanDependencies",
        this.scanDependencies.bind(this)
      ),
      vscode.commands.registerCommand(
        "safedeps.scanEcosystem",
        this.scanEcosystem.bind(this)
      ),
    ];

    context.subscriptions.push(...commands);
  }

  private helloWorld(): void {
    vscode.window.showInformationMessage("Hello World from SafeDeps!");
  }

  private async scanDependencies(): Promise<void> {
    try {
      const summary = await this._dependencyScanner.getScanSummary();
      const message = `Found ${summary.totalFiles} dependency files across ${
        Object.keys(summary.filesByLanguage).length
      } languages`;

      if (summary.totalFiles > 0) {
        const items = Object.entries(summary.filesByLanguage).map(
          ([language, count]) =>
            `${language}: ${count} file${count !== 1 ? "s" : ""}`
        );

        vscode.window.showInformationMessage(
          `${message}\\n\\n${items.join("\\n")}`,
          { modal: true }
        );
      } else {
        vscode.window.showInformationMessage(
          "No dependency files found in workspace"
        );
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to scan dependencies: ${(error as Error).message}`
      );
    }
  }

  private async scanEcosystem(): Promise<void> {
    try {
      const supportedEcosystems =
        this._ecosystemScanner.getSupportedEcosystems();

      const ecosystemItems = supportedEcosystems.map((ecosystem) => ({
        label: ecosystem,
        description: this.getEcosystemDescription(ecosystem),
        ecosystem,
      }));

      const selected = await vscode.window.showQuickPick(ecosystemItems, {
        placeHolder: "Select an ecosystem to scan",
        title: "SafeDeps - Ecosystem Scanner",
      });

      if (!selected) {
        return;
      }

      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Scanning ${selected.ecosystem} dependencies...`,
          cancellable: false,
        },
        async () => {
          const result = await this._ecosystemScanner.scanEcosystem(
            selected.ecosystem
          );

          if (result.totalFiles === 0) {
            vscode.window.showInformationMessage(
              `No ${selected.ecosystem} dependency files found in workspace`
            );
            return;
          }

          const message = `Found ${result.totalDependencies} dependencies in ${
            result.totalFiles
          } ${selected.ecosystem} file${result.totalFiles !== 1 ? "s" : ""}`;

          let details = "";
          if (result.vulnerablePackages > 0) {
            details += `\n🚨 ${result.vulnerablePackages} vulnerable packages`;
          }
          if (result.outdatedPackages > 0) {
            details += `\n📅 ${result.outdatedPackages} outdated packages`;
          }
          if (result.unknownLicensePackages > 0) {
            details += `\n📄 ${result.unknownLicensePackages} packages with unknown licenses`;
          }

          vscode.window.showInformationMessage(`${message}${details}`, {
            modal: true,
          });
        }
      );
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to scan ecosystem: ${(error as Error).message}`
      );
    }
  }

  private getEcosystemDescription(ecosystem: DependencyEcosystem): string {
    const descriptions: Record<DependencyEcosystem, string> = {
      npm: "JavaScript/TypeScript packages (package.json)",
      PyPI: "Python packages (requirements.txt)",
      Maven: "Java packages (pom.xml, build.gradle)",
      Go: "Go modules (go.mod)",
      "crates.io": "Rust packages (Cargo.toml)",
      RubyGems: "Ruby packages (Gemfile)",
      Packagist: "PHP packages (composer.json)",
    };
    return descriptions[ecosystem] || "";
  }
}
