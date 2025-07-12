export const getWebviewStyles = (): string => {
  return `
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            font-weight: var(--vscode-font-weight);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            padding: 16px;
            box-sizing: border-box;
        }
        .header {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        .header-icon {
            width: 24px;
            height: 24px;
            margin-right: 8px;
            opacity: 0.8;
        }
        .header-title {
            font-size: 16px;
            font-weight: 600;
            color: var(--vscode-titleBar-activeForeground);
        }
        .scan-button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            margin-bottom: 16px;
            width: 100%;
        }
        .scan-button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .summary {
            margin-bottom: 20px;
            padding: 12px;
            background-color: var(--vscode-textBlockQuote-background);
            border-radius: 4px;
            border-left: 3px solid var(--vscode-textBlockQuote-border);
        }
        .summary-title {
            font-weight: 600;
            margin-bottom: 8px;
            color: var(--vscode-titleBar-activeForeground);
        }
        .summary-stats {
            font-size: 13px;
            color: var(--vscode-descriptionForeground);
        }
        .dependency-files {
            margin-top: 16px;
        }
        .language-group {
            margin-bottom: 16px;
        }
        .language-header {
            font-weight: 600;
            margin-bottom: 8px;
            padding: 4px 0;
            color: var(--vscode-titleBar-activeForeground);
            border-bottom: 1px solid var(--vscode-panel-border);
            cursor: pointer;
        }
        .file-item {
            display: flex;
            align-items: center;
            padding: 6px 8px;
            margin: 2px 0;
            border-radius: 3px;
            cursor: pointer;
            transition: background-color 0.1s;
        }
        .file-item:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
        .file-icon {
            width: 16px;
            height: 16px;
            margin-right: 8px;
            opacity: 0.7;
        }
        .file-name {
            font-size: 13px;
            flex: 1;
        }
        .file-path {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            margin-top: 2px;
        }
        .loading {
            text-align: center;
            padding: 20px;
            color: var(--vscode-descriptionForeground);
        }
        .error {
            color: var(--vscode-errorForeground);
            background-color: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            padding: 12px;
            border-radius: 4px;
            margin: 16px 0;
        }
        .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: var(--vscode-descriptionForeground);
        }
        .empty-state-icon {
            width: 48px;
            height: 48px;
            margin: 0 auto 16px;
            opacity: 0.5;
        }
    `;
};
