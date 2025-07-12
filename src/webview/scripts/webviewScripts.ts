export const getWebviewJavaScript = (): string => {
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
        // Request scan results when the webview loads
        window.addEventListener('DOMContentLoaded', () => {
            vscode.postMessage({ command: 'scanDependencies' });
        });
    `;
};
