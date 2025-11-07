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
  private _hasAutoScanned: boolean = false; // Track if we've already auto-scanned

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

    // Trigger automatic scan on first view resolution if enabled and not already scanned
    const config = vscode.workspace.getConfiguration("safedeps");
    const autoScanEnabled = config.get<boolean>("autoScanOnOpen", true);

    if (
      autoScanEnabled &&
      !this._hasAutoScanned &&
      !this._lastScanResult &&
      !this._isScanning
    ) {
      this._hasAutoScanned = true;
      // Delay slightly to ensure webview is fully loaded
      setTimeout(() => {
        this._triggerAutoScan();
      }, 500);
    }
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
        case "updateGitignoreSetting":
          this._updateGitignoreSetting(message.value);
          break;
        case "getGitignoreSetting":
          this._sendGitignoreSetting();
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
        // Automatically trigger a scan when the extension first opens
        // The webview will handle this via its DOMContentLoaded event
        // which will trigger scanDependencies() if no saved state exists
      }
      // If neither scanning nor previous results exist, the webview's DOMContentLoaded
      // event will check its persisted state or trigger a new scan
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

  private _triggerAutoScan(): void {
    // Automatically trigger a scan when the extension opens
    // This will show a loading state and perform the scan
    if (this._view) {
      this._view.webview.postMessage({
        command: "autoScan",
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

  private async _updateGitignoreSetting(value: boolean): Promise<void> {
    try {
      const config = vscode.workspace.getConfiguration("safedeps");
      await config.update(
        "respectGitignore",
        value,
        vscode.ConfigurationTarget.Global
      );

      // Clear the gitignore cache when the setting changes
      if (this._dependencyScanner) {
        const baseScannerAny = this._dependencyScanner as any;
        if (
          baseScannerAny.gitIgnoreService &&
          typeof baseScannerAny.gitIgnoreService.clearCache === "function"
        ) {
          baseScannerAny.gitIgnoreService.clearCache();
        }
      }

      if (this._ecosystemScanner) {
        const baseScannerAny = this._ecosystemScanner as any;
        if (
          baseScannerAny.gitIgnoreService &&
          typeof baseScannerAny.gitIgnoreService.clearCache === "function"
        ) {
          baseScannerAny.gitIgnoreService.clearCache();
        }
      }
    } catch (error) {
      console.error("Failed to update gitignore setting:", error);
      vscode.window.showErrorMessage(
        `Failed to update .gitignore setting: ${(error as Error).message}`
      );
    }
  }

  private async _sendGitignoreSetting(): Promise<void> {
    try {
      const config = vscode.workspace.getConfiguration("safedeps");
      const respectGitignore = config.get<boolean>("respectGitignore", true);

      if (this._view) {
        this._view.webview.postMessage({
          command: "updateGitignoreSetting",
          value: respectGitignore,
        });
      }
    } catch (error) {
      console.error("Failed to get gitignore setting:", error);
    }
  }
}
