import * as vscode from "vscode";
import { DependencyScanner } from "../core/DependencyScanner";

export class SafeDepsCommands {
  private _dependencyScanner: DependencyScanner;

  constructor() {
    this._dependencyScanner = new DependencyScanner();
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
        "safedeps.analyzePackageJson",
        this.analyzePackageJson.bind(this)
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

  private async analyzePackageJson(): Promise<void> {
    try {
      const summary = await this._dependencyScanner.getPackageJsonSummary();

      if (summary.totalPackageFiles === 0) {
        vscode.window.showInformationMessage(
          "No package.json files found in workspace"
        );
        return;
      }

      const breakdown = Object.entries(summary.dependencyBreakdown)
        .filter(([, count]) => count > 0)
        .map(([type, count]) => `${type}: ${count}`)
        .join(", ");

      const message = `Found ${summary.totalDependencies} dependencies in ${
        summary.totalPackageFiles
      } package.json file${summary.totalPackageFiles !== 1 ? "s" : ""}`;

      vscode.window.showInformationMessage(
        `${message}\\n\\nBreakdown: ${breakdown}`,
        { modal: true }
      );
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to analyze package.json files: ${(error as Error).message}`
      );
    }
  }
}
