import { getEcosystemDropdownButtonStyles } from "../components/EcosystemDropdown";

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
        ${getEcosystemDropdownButtonStyles()}
        .action-bar {
            margin-bottom: 16px;
            display: flex;
            gap: 8px;
        }
        .action-button {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-panel-border);
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            flex: 1;
        }
        .action-button:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
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
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 8px;
            min-height: 20px;
        }
        .language-header-content {
            flex: 1;
            min-width: 0; /* Allow content to shrink */
        }
        .toggle-icon {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            flex-shrink: 0; /* Prevent icon from shrinking */
            margin-top: 2px; /* Align with first line of text */
        }
        .file-dependencies {
            margin-left: 12px;
            border-left: 2px solid var(--vscode-panel-border);
            padding-left: 8px;
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
        .vulnerability-badge {
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: 600;
            margin-left: 4px;
            text-transform: uppercase;
        }
        .vulnerability-badge.critical {
            background-color: #dc3545;
            color: white;
        }
        .vulnerability-badge.high {
            background-color: #fd7e14;
            color: white;
        }
        .vulnerability-badge.medium {
            background-color: #ffc107;
            color: #212529;
        }
        .vulnerability-badge.low {
            background-color: #28a745;
            color: white;
        }
        .vulnerability-badge.unknown {
            background-color: #6c757d;
            color: white;
        }
        .vulnerability-warning {
            color: #dc3545;
            font-weight: 600;
        }
        .outdated-warning {
            color: #fd7e14;
            font-weight: 500;
        }
        .license-warning {
            color: #6c757d;
            font-weight: 500;
        }
        .vulnerability-count {
            background-color: #dc3545;
            color: white;
            border-radius: 50%;
            padding: 2px 6px;
            font-size: 10px;
            font-weight: 600;
            margin-left: 6px;
            min-width: 16px;
            text-align: center;
            display: inline-block;
        }
        .vulnerability-details {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            margin-top: 4px;
            padding: 4px 0;
            border-top: 1px solid var(--vscode-panel-border);
        }
        .vulnerability-item {
            margin: 2px 0;
            padding: 2px 4px;
            background-color: rgba(220, 53, 69, 0.1);
            border-radius: 2px;
        }
        .vulnerability-cve {
            font-family: monospace;
            font-size: 10px;
            color: var(--vscode-textLink-foreground);
        }
        .vulnerability-summary {
            font-size: 10px;
            margin-top: 1px;
            color: var(--vscode-descriptionForeground);
        }
        .package-item.vulnerable {
            border-left-color: #dc3545;
            background-color: rgba(220, 53, 69, 0.05);
        }
        .filter-bar {
            margin-bottom: 16px;
            padding: 8px;
            background-color: var(--vscode-textBlockQuote-background);
            border-radius: 4px;
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }
        .filter-button {
            padding: 4px 8px;
            border: 1px solid var(--vscode-panel-border);
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
            transition: all 0.2s;
        }
        .filter-button.active {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border-color: var(--vscode-button-background);
        }
        .filter-button:hover {
            background-color: var(--vscode-button-hoverBackground);
            color: var(--vscode-button-foreground);
        }
        .vulnerability-stats {
            font-size: 11px;
            margin-top: 4px;
            color: var(--vscode-descriptionForeground);
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
        }
        .vulnerability-stat {
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .vulnerability-stat-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
        }
        .vulnerability-stat-dot.critical { background-color: #dc3545; }
        .vulnerability-stat-dot.high { background-color: #fd7e14; }
        .vulnerability-stat-dot.medium { background-color: #ffc107; }
        .vulnerability-stat-dot.low { background-color: #28a745; }
        .vulnerability-stat-dot.unknown { background-color: #6c757d; }
    `;
};
