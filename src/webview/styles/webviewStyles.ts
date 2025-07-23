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
        .package-metadata {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            margin-top: 2px;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        .metadata-item {
            display: flex;
            align-items: center;
            gap: 2px;
        }
        .metadata-badge {
            padding: 1px 4px;
            border-radius: 2px;
            font-size: 10px;
            font-weight: 500;
        }
        .metadata-badge.outdated {
            background-color: var(--vscode-errorBackground);
            color: var(--vscode-errorForeground);
        }
        .metadata-badge.unknown-license {
            background-color: var(--vscode-warningBackground);
            color: var(--vscode-warningForeground);
        }
        .metadata-badge.good {
            background-color: var(--vscode-charts-green);
            color: var(--vscode-editor-background);
        }
        .package-item {
            border-left: 3px solid transparent;
            transition: border-color 0.2s;
        }
        .package-item.outdated {
            border-left-color: var(--vscode-errorForeground);
            background-color: rgba(255, 99, 71, 0.05);
        }
        .package-item.unknown-license {
            border-left-color: var(--vscode-warningForeground);
            background-color: rgba(255, 193, 7, 0.05);
        }
        .package-item.critical {
            border-left-color: var(--vscode-errorForeground);
            background-color: rgba(255, 99, 71, 0.1);
        }
        .size-indicator {
            display: inline-block;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            margin-right: 4px;
        }
        .size-small { background-color: var(--vscode-charts-green); }
        .size-medium { background-color: var(--vscode-charts-yellow); }
        .size-large { background-color: var(--vscode-charts-orange); }
        .size-huge { background-color: var(--vscode-charts-red); }
        .summary-alerts {
            margin-top: 8px;
            padding: 8px;
            border-radius: 4px;
            background-color: var(--vscode-warningBackground);
            color: var(--vscode-warningForeground);
            font-size: 12px;
        }
        .summary-alerts.hidden {
            display: none;
        }
    `;
};
