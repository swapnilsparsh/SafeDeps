export const generateWebviewHtml = (): string => {
  return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>SafeDeps</title>
            <style>
                ${getWebviewStyles()}
            </style>
        </head>
        <body>
            ${getWebviewHeader()}
            ${getWebviewButtons()}
            ${getWebviewContent()}
            ${getWebviewScript()}
        </body>
        </html>`;
};

const getWebviewStyles = (): string => {
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

const getWebviewHeader = (): string => {
  return `
        <div class="header">
            <svg class="header-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C10.9391 2 9.92172 2.42143 9.17157 3.17157C8.42143 3.92172 8 4.93913 8 6C8 7.06087 8.42143 8.07828 9.17157 8.82843C9.92172 9.57857 10.9391 10 12 10C13.0609 10 14.0783 9.57857 14.8284 8.82843C15.5786 8.07828 16 7.06087 16 6C16 4.93913 15.5786 3.92172 14.8284 3.17157C14.0783 2.42143 13.0609 2 12 2Z" fill="currentColor"/>
                <path d="M12 12C9.79086 12 7.67286 12.8786 6.10714 14.4443C4.54143 16.01 3.66284 18.1281 3.66284 20.3371V22H20.3372V20.3371C20.3372 18.1281 19.4586 16.01 17.8929 14.4443C16.3271 12.8786 14.2091 12 12 12Z" fill="currentColor"/>
                <circle cx="18" cy="6" r="4" fill="#FF6B6B" stroke="white" stroke-width="1"/>
                <path d="M16.5 6L17.5 7L19.5 5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <div class="header-title">SafeDeps</div>
        </div>
    `;
};

const getWebviewButtons = (): string => {
  return `
        <button class="scan-button" onclick="scanDependencies()">
            🔍 Scan Dependencies
        </button>
        <button class="scan-button" onclick="scanPackageJson()">
            📦 Analyze package.json Dependencies
        </button>
    `;
};

const getWebviewContent = (): string => {
  return `
        <div id="content">
            <div class="loading">
                <div>Scanning workspace for dependency files...</div>
            </div>
        </div>
    `;
};

const getWebviewScript = (): string => {
  return `
        <script>
            ${getWebviewJavaScript()}
        </script>
    `;
};

const getWebviewJavaScript = (): string => {
  return `
        const vscode = acquireVsCodeApi();

        function scanDependencies() {
            document.getElementById('content').innerHTML = '<div class="loading">Scanning workspace...</div>';
            vscode.postMessage({ command: 'scanDependencies' });
        }

        function scanPackageJson() {
            document.getElementById('content').innerHTML = '<div class="loading">Analyzing package.json dependencies...</div>';
            vscode.postMessage({ command: 'scanPackageJson' });
        }

        function openFile(filePath) {
            vscode.postMessage({ command: 'openFile', filePath: filePath });
        }

        function getFileIcon(type) {
            const icons = {
                'package.json': '📦',
                'requirements.txt': '🐍',
                'go.mod': '🐹',
                'Cargo.toml': '🦀',
                'pom.xml': '☕',
                'build.gradle': '🐘',
                'Gemfile': '💎',
                'composer.json': '🐘'
            };
            return icons[type] || '📄';
        }

        function renderDependencies(summary) {
            const content = document.getElementById('content');

            if (summary.totalFiles === 0) {
                content.innerHTML = \`
                    <div class="empty-state">
                        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <div>No dependency files found in workspace</div>
                        <div style="font-size: 12px; margin-top: 8px;">
                            Supported: package.json, requirements.txt, go.mod, Cargo.toml, pom.xml, build.gradle, Gemfile, composer.json
                        </div>
                    </div>
                \`;
                return;
            }

            let html = \`
                <div class="summary">
                    <div class="summary-title">Scan Results</div>
                    <div class="summary-stats">
                        Found \${summary.totalFiles} dependency file\${summary.totalFiles !== 1 ? 's' : ''}
                        across \${Object.keys(summary.filesByLanguage).length} language\${Object.keys(summary.filesByLanguage).length !== 1 ? 's' : ''}
                    </div>
                </div>
                <div class="dependency-files">
            \`;

            const filesByLanguage = {};
            summary.files.forEach(file => {
                if (!filesByLanguage[file.language]) {
                    filesByLanguage[file.language] = [];
                }
                filesByLanguage[file.language].push(file);
            });

            Object.keys(filesByLanguage).sort().forEach(language => {
                const files = filesByLanguage[language];
                html += \`
                    <div class="language-group">
                        <div class="language-header">\${language} (\${files.length})</div>
                \`;

                files.forEach(file => {
                    html += \`
                        <div class="file-item" onclick="openFile('\${file.filePath.replace(/\\\\/g, '\\\\\\\\')}')">
                            <span class="file-icon">\${getFileIcon(file.type)}</span>
                            <div>
                                <div class="file-name">\${file.type}</div>
                                <div class="file-path">\${file.relativePath}</div>
                            </div>
                        </div>
                    \`;
                });

                html += '</div>';
            });

            html += '</div>';
            content.innerHTML = html;
        }

        function renderPackageJsonDependencies(summary) {
            const content = document.getElementById('content');

            if (summary.totalPackageFiles === 0) {
                content.innerHTML = \`
                    <div class="empty-state">
                        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <div>No package.json files found in workspace</div>
                    </div>
                \`;
                return;
            }

            let html = \`
                <div class="summary">
                    <div class="summary-title">Package.json Analysis</div>
                    <div class="summary-stats">
                        Found \${summary.totalDependencies} dependencies across \${summary.totalPackageFiles} package.json file\${summary.totalPackageFiles !== 1 ? 's' : ''}
                        <br>
                        Dependencies: \${summary.dependencyBreakdown.dependencies} |
                        DevDependencies: \${summary.dependencyBreakdown.devDependencies}
                        \${summary.dependencyBreakdown.peerDependencies > 0 ? ' | Peer: ' + summary.dependencyBreakdown.peerDependencies : ''}
                        \${summary.dependencyBreakdown.optionalDependencies > 0 ? ' | Optional: ' + summary.dependencyBreakdown.optionalDependencies : ''}
                    </div>
                </div>
                <div class="dependency-files">
            \`;

            summary.packages.forEach(pkg => {
                html += \`
                    <div class="language-group">
                        <div class="language-header" onclick="openFile('\${pkg.filePath.replace(/\\\\/g, '\\\\\\\\')}')">
                            📦 \${pkg.packageName || 'package.json'} (\${pkg.totalDependencies} deps)
                            <div style="font-size: 11px; color: var(--vscode-descriptionForeground); font-weight: normal;">
                                \${pkg.relativePath}
                            </div>
                        </div>
                \`;

                const depTypes = ['dependency', 'devDependency', 'peerDependency', 'optionalDependency'];
                const typeLabels = {
                    'dependency': 'Dependencies',
                    'devDependency': 'Dev Dependencies',
                    'peerDependency': 'Peer Dependencies',
                    'optionalDependency': 'Optional Dependencies'
                };

                depTypes.forEach(type => {
                    const depsOfType = pkg.dependencies.filter(dep => dep.type === type);
                    if (depsOfType.length > 0) {
                        html += \`<div style="margin: 8px 0; padding-left: 16px;">
                            <div style="font-weight: 500; font-size: 12px; color: var(--vscode-titleBar-activeForeground); margin-bottom: 4px;">
                                \${typeLabels[type]} (\${depsOfType.length})
                            </div>\`;

                        depsOfType.forEach(dep => {
                            const typeColor = {
                                'dependency': '#4CAF50',
                                'devDependency': '#FF9800',
                                'peerDependency': '#2196F3',
                                'optionalDependency': '#9C27B0'
                            }[type];

                            html += \`
                                <div class="file-item" style="padding: 4px 8px;">
                                    <span style="width: 8px; height: 8px; border-radius: 50%; background-color: \${typeColor}; margin-right: 8px; flex-shrink: 0;"></span>
                                    <div style="flex: 1;">
                                        <div class="file-name">\${dep.name}</div>
                                        <div class="file-path">\${dep.version}</div>
                                    </div>
                                </div>
                            \`;
                        });

                        html += '</div>';
                    }
                });

                html += '</div>';
            });

            html += '</div>';
            content.innerHTML = html;
        }

        function showError(error) {
            const content = document.getElementById('content');
            content.innerHTML = \`
                <div class="error">
                    <strong>Error:</strong> \${error}
                </div>
            \`;
        }

        // Handle messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'updateDependencies':
                    renderDependencies(message.data);
                    break;
                case 'updatePackageJsonDependencies':
                    renderPackageJsonDependencies(message.data);
                    break;
                case 'showError':
                    showError(message.error);
                    break;
            }
        });
    `;
};
