import * as vscode from "vscode";
import { SafeDepsWebviewViewProvider } from "./providers/SafeDepsWebviewViewProvider";
import { SafeDepsCommands } from "./commands/SafeDepsCommands";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "safedeps" is now active!');

  const provider = new SafeDepsWebviewViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SafeDepsWebviewViewProvider.viewType,
      provider
    )
  );

  const commandManager = new SafeDepsCommands();
  commandManager.registerCommands(context);
}

export function deactivate() {}
