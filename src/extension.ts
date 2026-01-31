import * as vscode from "vscode";
import { SafeDepsWebviewViewProvider } from "./providers/SafeDepsWebviewViewProvider";
import { SafeDepsCommands } from "./commands/SafeDepsCommands";
import { GitIgnoreService } from "./services/gitignore";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "safedeps" is now active!');

  // Verify security implementation on startup
  const securityCheck = GitIgnoreService.verifySecurityImplementation();
  if (!securityCheck.isValid) {
    console.error(
      "[SafeDeps] Security verification FAILED:",
      securityCheck.issues,
    );
    vscode.window
      .showErrorMessage(
        "SafeDeps: Security verification failed. Please report this issue.",
        "View Details",
      )
      .then((selection) => {
        if (selection === "View Details") {
          vscode.window.showErrorMessage(
            `Security Issues: ${securityCheck.issues.join("; ")}`,
          );
        }
      });
  } else {
    console.log(
      `[SafeDeps] Security verified: ${securityCheck.securityPatternCount} patterns active`,
    );
  }

  const provider = new SafeDepsWebviewViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SafeDepsWebviewViewProvider.viewType,
      provider,
    ),
  );

  const commandManager = new SafeDepsCommands();
  commandManager.registerCommands(context);

  // Register security verification command
  context.subscriptions.push(
    vscode.commands.registerCommand("safedeps.verifySecurity", () => {
      const verification = GitIgnoreService.verifySecurityImplementation();
      const message = verification.isValid
        ? `✅ Security Verified\n\n` +
          `• ${verification.securityPatternCount} security patterns active\n` +
          `• All critical patterns present\n` +
          `• Security files will never be scanned`
        : `❌ Security Verification Failed\n\n` +
          `Issues: ${verification.issues.join("\n")}`;

      vscode.window.showInformationMessage(message, { modal: true });
    }),
  );
}

export function deactivate() {}
