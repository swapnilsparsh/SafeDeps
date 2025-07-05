import * as vscode from "vscode";
import { DependencyScanner } from "../core/DependencyScanner";
import { generateWebviewHtml } from "../ui/WebviewTemplate";

export class SafeDepsWebviewViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "safedeps-view";

  private _view?: vscode.WebviewView;
  private _dependencyScanner: DependencyScanner;

  constructor(private readonly _extensionUri: vscode.Uri) {
    this._dependencyScanner = new DependencyScanner();
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    this._setupMessageHandling(webviewView);
    this._loadInitialContent();
  }

  private _setupMessageHandling(webviewView: vscode.WebviewView): void {
    webviewView.webview.onDidReceiveMessage((message) => {
      switch (message.command) {
        case "scanDependencies":
          this._scanAndDisplayDependencies();
          break;
        case "scanPackageJson":
          this._scanPackageJsonDependencies();
          break;
        case "openFile":
          this._openFile(message.filePath);
          break;
      }
    });
  }

  private async _loadInitialContent(): Promise<void> {
    if (this._view) {
      this._view.webview.html = generateWebviewHtml();
      await this._scanAndDisplayDependencies();
    }
  }

  private async _scanAndDisplayDependencies(): Promise<void> {
    if (!this._view) {
      return;
    }

    try {
      const summary = await this._dependencyScanner.getScanSummary();

      this._view.webview.postMessage({
        command: "updateDependencies",
        data: summary,
      });
    } catch (error) {
      this._handleError("Failed to scan dependencies", error);
    }
  }

  private async _scanPackageJsonDependencies(): Promise<void> {
    if (!this._view) {
      return;
    }

    try {
      const summary = await this._dependencyScanner.getPackageJsonSummary();

      this._view.webview.postMessage({
        command: "updatePackageJsonDependencies",
        data: summary,
      });
    } catch (error) {
      this._handleError("Failed to scan package.json dependencies", error);
    }
  }

  private async _openFile(filePath: string): Promise<void> {
    try {
      const document = await vscode.workspace.openTextDocument(filePath);
      await vscode.window.showTextDocument(document);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open file: ${filePath}`);
    }
  }

  private _handleError(message: string, error: unknown): void {
    console.error(`${message}:`, error);

    if (this._view) {
      this._view.webview.postMessage({
        command: "showError",
        error: `${message}: ${(error as Error).message}`,
      });
    }
  }
}
