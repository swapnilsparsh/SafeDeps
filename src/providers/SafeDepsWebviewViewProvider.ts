import * as vscode from "vscode";
import { DependencyScanner } from "../core/DependencyScanner";
import { EcosystemScanner } from "../core/EcosystemScanner";
import { generateWebviewHtml } from "../ui/WebviewTemplate";

export class SafeDepsWebviewViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "safedeps-view";

  private _view?: vscode.WebviewView;
  private _dependencyScanner: DependencyScanner;
  private _ecosystemScanner: EcosystemScanner;
  private _lastScanResult: any = null;
  private _lastCommand: string | null = null;
  private _isScanning: boolean = false;
  private _currentScanType: string | null = null;
  private _lastProgress: any = null;

  constructor(private readonly _extensionUri: vscode.Uri) {
    this._dependencyScanner = new DependencyScanner();
    this._ecosystemScanner = new EcosystemScanner();
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
        case "scanEcosystem":
          this._scanEcosystemDependencies(message.ecosystem);
          break;
        case "scanAllEcosystems":
          this._scanAllEcosystemsDependencies();
          break;
        case "openFile":
          this._openFile(message.filePath);
          break;
        case "openUrl":
          this._openUrl(message.url);
          break;
        case "restoreData":
          this._restoreLastData();
          break;
      }
    });
  }

  private async _loadInitialContent(): Promise<void> {
    if (this._view) {
      this._view.webview.html = generateWebviewHtml();

      // If currently scanning, restore the loading state with last progress
      if (this._isScanning && this._currentScanType) {
        this._restoreScanningState();
      } else if (this._lastScanResult && this._lastCommand) {
        // If we have previous results, restore them
        this._restoreLastData();
      } else {
        // Otherwise, start a new scan
        await this._scanAndDisplayDependencies();
      }
    }
  }

  private _restoreScanningState(): void {
    if (!this._view || !this._currentScanType) {
      return;
    }

    // Send message to webview to show loading state
    this._view.webview.postMessage({
      command: "restoreLoadingState",
      scanType: this._currentScanType,
      progress: this._lastProgress,
    });
  }

  private _restoreLastData(): void {
    if (this._view && this._lastScanResult && this._lastCommand) {
      let updateCommand = "updateDependencies";
      if (this._lastCommand === "scanEcosystem") {
        updateCommand = "updateEcosystemDependencies";
      } else if (this._lastCommand === "scanAllEcosystems") {
        updateCommand = "updateAllEcosystemsDependencies";
      }
      this._view.webview.postMessage({
        command: updateCommand,
        data: this._lastScanResult,
      });
    }
  }

  private async _scanAndDisplayDependencies(): Promise<void> {
    if (!this._view) {
      return;
    }

    try {
      // No progress needed for simple scan summary
      const summary = await this._dependencyScanner.getScanSummary();

      this._lastScanResult = summary;
      this._lastCommand = "scanDependencies";

      this._view.webview.postMessage({
        command: "updateDependencies",
        data: summary,
      });
    } catch (error) {
      this._handleError("Failed to scan dependencies", error);
    }
  }

  private async _scanEcosystemDependencies(ecosystem: string): Promise<void> {
    if (!this._view) {
      return;
    }

    try {
      // Mark as scanning
      this._isScanning = true;
      this._currentScanType = `ecosystem:${ecosystem}`;

      // Set up progress callback
      const progressReporter = this._ecosystemScanner.getProgressReporter();
      progressReporter.setCallback((update) => {
        this._lastProgress = update;
        if (this._view) {
          this._view.webview.postMessage({
            command: "updateProgress",
            progress: update,
          });
        }
      });

      const summary = await this._ecosystemScanner.scanEcosystem(
        ecosystem as any
      );

      // Clear progress callback and scanning state
      progressReporter.clearCallback();
      this._isScanning = false;
      this._currentScanType = null;
      this._lastProgress = null;

      this._lastScanResult = summary;
      this._lastCommand = "scanEcosystem";

      this._view.webview.postMessage({
        command: "updateEcosystemDependencies",
        data: summary,
      });
    } catch (error) {
      this._isScanning = false;
      this._currentScanType = null;
      this._lastProgress = null;
      this._handleError(`Failed to scan ${ecosystem} dependencies`, error);
    }
  }

  private async _scanAllEcosystemsDependencies(): Promise<void> {
    if (!this._view) {
      return;
    }

    try {
      // Mark as scanning
      this._isScanning = true;
      this._currentScanType = "allEcosystems";

      // Set up progress callback
      const progressReporter = this._dependencyScanner.getProgressReporter();
      progressReporter.setCallback((update) => {
        this._lastProgress = update;
        if (this._view) {
          this._view.webview.postMessage({
            command: "updateProgress",
            progress: update,
          });
        }
      });

      const summary =
        await this._dependencyScanner.getUnifiedDependencySummaryWithVulnerabilities();

      // Clear progress callback and scanning state
      progressReporter.clearCallback();
      this._isScanning = false;
      this._currentScanType = null;
      this._lastProgress = null;

      this._lastScanResult = summary;
      this._lastCommand = "scanAllEcosystems";

      this._view.webview.postMessage({
        command: "updateAllEcosystemsDependencies",
        data: summary,
      });
    } catch (error) {
      this._isScanning = false;
      this._currentScanType = null;
      this._lastProgress = null;
      this._handleError("Failed to scan all ecosystems dependencies", error);
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

  private async _openUrl(url: string): Promise<void> {
    try {
      await vscode.env.openExternal(vscode.Uri.parse(url));
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open URL: ${url}`);
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
