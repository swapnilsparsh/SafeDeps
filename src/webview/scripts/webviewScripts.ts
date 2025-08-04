export const getWebviewJavaScript = (): string => {
  return `
        const vscode = acquireVsCodeApi();

        let isLoading = false;
        let lastData = null;
        let lastCommand = null;
        let currentFilter = 'all'; // 'all', 'vulnerable', 'critical', 'high', 'medium', 'low'

        function scanDependencies() {
            if (isLoading) return;

            setLoadingState(true);
            lastCommand = 'scanDependencies';
            document.getElementById('content').innerHTML = \`
                <div class="loading">
                    <div class="loading-spinner"></div>
                    <div>Scanning workspace...</div>
                </div>
            \`;
            vscode.postMessage({ command: 'scanDependencies' });
        }

        function scanPackageJson() {
            if (isLoading) return;

            setLoadingState(true);
            lastCommand = 'scanPackageJson';
            document.getElementById('content').innerHTML = \`
                <div class="loading">
                    <div class="loading-spinner"></div>
                    <div>Analyzing dependencies and fetching metadata from npm registry...</div>
                </div>
            \`;
            vscode.postMessage({ command: 'scanPackageJson' });
        }

        function scanAllEcosystems() {
            if (isLoading) return;

            setLoadingState(true);
            lastCommand = 'scanAllEcosystems';
            document.getElementById('content').innerHTML = \`
                <div class="loading">
                    <div class="loading-spinner"></div>
                    <div>Scanning all ecosystems and checking vulnerabilities...</div>
                </div>
            \`;
            vscode.postMessage({ command: 'scanAllEcosystems' });
        }

        function setLoadingState(loading) {
            isLoading = loading;
            const scanButton = document.querySelector('button[onclick="scanDependencies()"]');
            const packageButton = document.querySelector('button[onclick="scanPackageJson()"]');
            const allEcosystemsButton = document.querySelector('button[onclick="scanAllEcosystems()"]');

            if (scanButton) {
                scanButton.disabled = loading;
                scanButton.style.opacity = loading ? '0.6' : '1';
                scanButton.style.cursor = loading ? 'not-allowed' : 'pointer';
            }

            if (packageButton) {
                packageButton.disabled = loading;
                packageButton.style.opacity = loading ? '0.6' : '1';
                packageButton.style.cursor = loading ? 'not-allowed' : 'pointer';
            }

            if (allEcosystemsButton) {
                allEcosystemsButton.disabled = loading;
                allEcosystemsButton.style.opacity = loading ? '0.6' : '1';
                allEcosystemsButton.style.cursor = loading ? 'not-allowed' : 'pointer';
            }
        }

        function restoreLastData() {
            if (lastData && lastCommand) {
                if (lastCommand === 'scanDependencies') {
                    renderDependencies(lastData);
                } else if (lastCommand === 'scanPackageJson') {
                    renderPackageJsonDependencies(lastData);
                } else if (lastCommand === 'scanAllEcosystems') {
                    renderAllEcosystemsDependencies(lastData);
                }
            }
        }

        function setVulnerabilityFilter(filter) {
            currentFilter = filter;
            document.querySelectorAll('.filter-button').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector(\`[data-filter="\${filter}"]\`).classList.add('active');

            if (lastData && lastCommand === 'scanPackageJson') {
                renderPackageJsonDependencies(lastData);
            }
        }

        function shouldShowPackage(pkg) {
            if (currentFilter === 'all') return true;
            if (currentFilter === 'vulnerable') {
                return pkg.dependencies.some(dep => dep.vulnerabilities && dep.vulnerabilities.length > 0);
            }

            const severityFilter = currentFilter.toUpperCase();
            return pkg.dependencies.some(dep =>
                dep.vulnerabilities && dep.vulnerabilities.some(vuln => vuln.severity === severityFilter)
            );
        }

        function shouldShowDependency(dep) {
            if (currentFilter === 'all') return true;
            if (currentFilter === 'vulnerable') {
                return dep.vulnerabilities && dep.vulnerabilities.length > 0;
            }

            const severityFilter = currentFilter.toUpperCase();
            return dep.vulnerabilities && dep.vulnerabilities.some(vuln => vuln.severity === severityFilter);
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

        function getEcosystemIcon(ecosystem) {
            const icons = {
                'npm': '📦',
                'PyPI': '🐍',
                'Go': '🐹',
                'crates.io': '🦀',
                'Maven': '☕',
                'RubyGems': '💎',
                'Packagist': '🐘'
            };
            return icons[ecosystem] || '📄';
        }

        function getEcosystemColor(ecosystem) {
            const colors = {
                'npm': '#cb3837',
                'PyPI': '#3776ab',
                'Go': '#00add8',
                'crates.io': '#ce422b',
                'Maven': '#f89820',
                'RubyGems': '#cc342d',
                'Packagist': '#4f5d95'
            };
            return colors[ecosystem] || '#666666';
        }

        function renderDependencies(summary) {
            setLoadingState(false);
            lastData = summary;
            lastCommand = 'scanDependencies';

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
            setLoadingState(false);
            lastData = summary;
            lastCommand = 'scanPackageJson';

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

            const hasAlerts = summary.outdatedPackages > 0 || summary.unknownLicensePackages > 0 || summary.vulnerablePackages > 0;
            const hasVulnerabilities = summary.vulnerablePackages > 0;

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
                        \${hasVulnerabilities ? \`<br><span class="vulnerability-warning">🚨 \${summary.vulnerablePackages} vulnerable package\${summary.vulnerablePackages !== 1 ? 's' : ''} found</span>\` : '<br>✅ No known vulnerabilities'}
                    </div>
                    \${hasVulnerabilities ? \`
                        <div class="vulnerability-stats">
                            \${summary.vulnerabilityBreakdown.critical > 0 ? \`<div class="vulnerability-stat"><span class="vulnerability-stat-dot critical"></span>Critical: \${summary.vulnerabilityBreakdown.critical}</div>\` : ''}
                            \${summary.vulnerabilityBreakdown.high > 0 ? \`<div class="vulnerability-stat"><span class="vulnerability-stat-dot high"></span>High: \${summary.vulnerabilityBreakdown.high}</div>\` : ''}
                            \${summary.vulnerabilityBreakdown.medium > 0 ? \`<div class="vulnerability-stat"><span class="vulnerability-stat-dot medium"></span>Medium: \${summary.vulnerabilityBreakdown.medium}</div>\` : ''}
                            \${summary.vulnerabilityBreakdown.low > 0 ? \`<div class="vulnerability-stat"><span class="vulnerability-stat-dot low"></span>Low: \${summary.vulnerabilityBreakdown.low}</div>\` : ''}
                            \${summary.vulnerabilityBreakdown.unknown > 0 ? \`<div class="vulnerability-stat"><span class="vulnerability-stat-dot unknown"></span>Unknown: \${summary.vulnerabilityBreakdown.unknown}</div>\` : ''}
                        </div>
                    \` : ''}
                    <div class="summary-alerts \${hasAlerts ? '' : 'hidden'}">
                        \${summary.outdatedPackages > 0 ? '⚠️ ' + summary.outdatedPackages + ' outdated package' + (summary.outdatedPackages !== 1 ? 's' : '') + ' (not updated in 1+ year)' : ''}
                        \${summary.unknownLicensePackages > 0 ? (summary.outdatedPackages > 0 ? '<br>' : '') + '❓ ' + summary.unknownLicensePackages + ' package' + (summary.unknownLicensePackages !== 1 ? 's' : '') + ' with unknown license' : ''}
                        \${summary.vulnerablePackages > 0 ? (summary.outdatedPackages > 0 || summary.unknownLicensePackages > 0 ? '<br>' : '') + '🚨 ' + summary.vulnerablePackages + ' vulnerable package' + (summary.vulnerablePackages !== 1 ? 's' : '') : ''}
                    </div>
                </div>
                <div class="filter-bar">
                    <span style="font-size: 11px; font-weight: 500;">Filter:</span>
                    <button class="filter-button active" data-filter="all" onclick="setVulnerabilityFilter('all')">All</button>
                    \${hasVulnerabilities ? \`<button class="filter-button" data-filter="vulnerable" onclick="setVulnerabilityFilter('vulnerable')">Vulnerable Only</button>\` : ''}
                    \${summary.vulnerabilityBreakdown.critical > 0 ? \`<button class="filter-button" data-filter="critical" onclick="setVulnerabilityFilter('critical')">Critical (\${summary.vulnerabilityBreakdown.critical})</button>\` : ''}
                    \${summary.vulnerabilityBreakdown.high > 0 ? \`<button class="filter-button" data-filter="high" onclick="setVulnerabilityFilter('high')">High (\${summary.vulnerabilityBreakdown.high})</button>\` : ''}
                    \${summary.vulnerabilityBreakdown.medium > 0 ? \`<button class="filter-button" data-filter="medium" onclick="setVulnerabilityFilter('medium')">Medium (\${summary.vulnerabilityBreakdown.medium})</button>\` : ''}
                    \${summary.vulnerabilityBreakdown.low > 0 ? \`<button class="filter-button" data-filter="low" onclick="setVulnerabilityFilter('low')">Low (\${summary.vulnerabilityBreakdown.low})</button>\` : ''}
                </div>
                <div class="dependency-files">
            \`;

            summary.packages.forEach(pkg => {
                if (!shouldShowPackage(pkg)) return;

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
                    const depsOfType = pkg.dependencies.filter(dep => dep.type === type && shouldShowDependency(dep));
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

                            const metadata = dep.metadata;
                            let packageClasses = 'file-item';
                            let alertBadges = '';
                            let vulnerabilityInfo = '';

                            if (metadata) {
                                if (metadata.hasVulnerabilities) {
                                    packageClasses += ' vulnerable';
                                } else if (metadata.isOutdated && metadata.hasUnknownLicense) {
                                    packageClasses += ' critical';
                                } else if (metadata.isOutdated) {
                                    packageClasses += ' outdated';
                                } else if (metadata.hasUnknownLicense) {
                                    packageClasses += ' unknown-license';
                                }

                                if (metadata.isOutdated) {
                                    alertBadges += '<span class="metadata-badge outdated">OUTDATED</span>';
                                }
                                if (metadata.hasUnknownLicense) {
                                    alertBadges += '<span class="metadata-badge unknown-license">NO LICENSE</span>';
                                }
                                if (metadata.hasVulnerabilities) {
                                    alertBadges += \`<span class="vulnerability-badge \${metadata.highestSeverity?.toLowerCase() || 'unknown'}">\${metadata.highestSeverity || 'VULN'}</span>\`;
                                    if (metadata.vulnerabilityCount > 1) {
                                        alertBadges += \`<span class="vulnerability-count">\${metadata.vulnerabilityCount}</span>\`;
                                    }
                                }

                                if (dep.vulnerabilities && dep.vulnerabilities.length > 0) {
                                    vulnerabilityInfo = '<div class="vulnerability-details">';
                                    dep.vulnerabilities.forEach(vuln => {
                                        vulnerabilityInfo += \`
                                            <div class="vulnerability-item">
                                                <div class="vulnerability-cve">\${vuln.id} \${vuln.cveIds.length > 0 ? '(' + vuln.cveIds.join(', ') + ')' : ''}</div>
                                                <div class="vulnerability-summary">\${vuln.summary}</div>
                                            </div>
                                        \`;
                                    });
                                    vulnerabilityInfo += '</div>';
                                }
                            }

                            html += \`
                                <div class="\${packageClasses} package-item" style="padding: 6px 8px;">
                                    <span style="width: 8px; height: 8px; border-radius: 50%; background-color: \${typeColor}; margin-right: 8px; flex-shrink: 0;"></span>
                                    <div style="flex: 1;">
                                        <div class="file-name">
                                            \${dep.name}
                                            \${alertBadges}
                                        </div>
                                        <div class="file-path">\${dep.version}</div>
                                        \${metadata ? renderPackageMetadata(metadata) : '<div class="package-metadata">Loading metadata...</div>'}
                                        \${vulnerabilityInfo}
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

        function renderPackageMetadata(metadata) {
            if (!metadata) {
                return '<div class="package-metadata">Metadata unavailable</div>';
            }

            const sizeClass = getSizeClass(metadata.size);
            const formattedSize = formatBytes(metadata.size);
            const lastUpdated = formatDate(new Date(metadata.lastUpdated));

            return \`
                <div class="package-metadata">
                    <div class="metadata-item">
                        <span class="size-indicator \${sizeClass}"></span>
                        <span>\${formattedSize}</span>
                    </div>
                    <div class="metadata-item">
                        📄 \${metadata.license}
                    </div>
                    <div class="metadata-item">
                        📅 \${lastUpdated}
                    </div>
                    \${metadata.author ? \`<div class="metadata-item">👤 \${metadata.author}</div>\` : ''}
                </div>
            \`;
        }

        function getSizeClass(size) {
            if (size < 50000) return 'size-small';
            if (size < 500000) return 'size-medium';
            if (size < 5000000) return 'size-large';
            return 'size-huge';
        }

        function formatBytes(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
        }

        function formatDate(date) {
            if (date.getTime() === 0) return 'Unknown';

            const now = new Date();
            const diffMs = now - date;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (diffDays < 30) {
                return \`\${diffDays}d ago\`;
            } else if (diffDays < 365) {
                const months = Math.floor(diffDays / 30);
                return \`\${months}mo ago\`;
            } else {
                const years = Math.floor(diffDays / 365);
                return \`\${years}y ago\`;
            }
        }

        function showError(error) {
            setLoadingState(false);
            const content = document.getElementById('content');
            content.innerHTML = \`
                <div class="error">
                    <strong>Error:</strong> \${error}
                </div>
            \`;
        }

        function renderAllEcosystemsDependencies(summary) {
            setLoadingState(false);
            lastData = summary;
            lastCommand = 'scanAllEcosystems';

            const content = document.getElementById('content');

            if (summary.totalFiles === 0) {
                content.innerHTML = \`
                    <div class="empty-state">
                        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <div>No dependency files found in workspace</div>
                    </div>
                \`;
                return;
            }

            const hasVulnerabilities = summary.vulnerablePackages > 0;

            let html = \`
                <div class="summary">
                    <div class="summary-title">Multi-Ecosystem Analysis</div>
                    <div class="summary-stats">
                        Found \${summary.totalDependencies} dependencies across \${summary.totalFiles} file\${summary.totalFiles !== 1 ? 's' : ''}
                        <br>
                        Ecosystems: \${Object.entries(summary.ecosystemBreakdown).map(([eco, count]) => \`\${getEcosystemIcon(eco)} \${eco}: \${count}\`).join(' | ')}
                        \${hasVulnerabilities ? \`<br><span class="vulnerability-warning">🚨 \${summary.vulnerablePackages} vulnerable package\${summary.vulnerablePackages !== 1 ? 's' : ''} found</span>\` : '<br>✅ No known vulnerabilities'}
                    </div>
                    \${hasVulnerabilities ? \`
                        <div class="vulnerability-stats">
                            \${summary.vulnerabilityBreakdown.critical > 0 ? \`<div class="vulnerability-stat"><span class="vulnerability-stat-dot critical"></span>Critical: \${summary.vulnerabilityBreakdown.critical}</div>\` : ''}
                            \${summary.vulnerabilityBreakdown.high > 0 ? \`<div class="vulnerability-stat"><span class="vulnerability-stat-dot high"></span>High: \${summary.vulnerabilityBreakdown.high}</div>\` : ''}
                            \${summary.vulnerabilityBreakdown.medium > 0 ? \`<div class="vulnerability-stat"><span class="vulnerability-stat-dot medium"></span>Medium: \${summary.vulnerabilityBreakdown.medium}</div>\` : ''}
                            \${summary.vulnerabilityBreakdown.low > 0 ? \`<div class="vulnerability-stat"><span class="vulnerability-stat-dot low"></span>Low: \${summary.vulnerabilityBreakdown.low}</div>\` : ''}
                            \${summary.vulnerabilityBreakdown.unknown > 0 ? \`<div class="vulnerability-stat"><span class="vulnerability-stat-dot unknown"></span>Unknown: \${summary.vulnerabilityBreakdown.unknown}</div>\` : ''}
                        </div>
                    \` : ''}
                </div>
                <div class="dependency-files">
            \`;

            const filesByEcosystem = {};
            summary.files.forEach(fileData => {
                const ecosystem = fileData.file.ecosystem;
                if (!filesByEcosystem[ecosystem]) {
                    filesByEcosystem[ecosystem] = [];
                }
                filesByEcosystem[ecosystem].push(fileData);
            });

            Object.keys(filesByEcosystem).sort().forEach(ecosystem => {
                const files = filesByEcosystem[ecosystem];
                const ecosystemColor = getEcosystemColor(ecosystem);

                html += \`
                    <div class="language-group">
                        <div class="language-header" style="border-left: 4px solid \${ecosystemColor}; padding-left: 8px;">
                            \${getEcosystemIcon(ecosystem)} \${ecosystem} (\${files.length} file\${files.length !== 1 ? 's' : ''})
                        </div>
                \`;

                files.forEach(fileData => {
                    const file = fileData.file;
                    const totalDeps = fileData.dependencies.length;
                    const vulnerableDeps = fileData.dependencies.filter(dep => dep.vulnerabilities && dep.vulnerabilities.length > 0);

                    html += \`
                        <div class="file-item" onclick="openFile('\${file.filePath.replace(/\\\\/g, '\\\\\\\\')}')">
                            <span class="file-icon">\${getFileIcon(file.type)}</span>
                            <div>
                                <div class="file-name">\${file.type}</div>
                                <div class="file-path">\${file.relativePath}</div>
                                <div class="package-metadata">
                                    \${totalDeps} dependencies
                                    \${vulnerableDeps.length > 0 ? \`<span class="vulnerability-warning"> • \${vulnerableDeps.length} vulnerable</span>\` : ''}
                                </div>
                            </div>
                        </div>
                    \`;
                });

                html += '</div>';
            });

            html += '</div>';
            content.innerHTML = html;
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
                case 'updateAllEcosystemsDependencies':
                    renderAllEcosystemsDependencies(message.data);
                    break;
                case 'showError':
                    showError(message.error);
                    break;
            }
        });

        window.addEventListener('focus', () => {
            restoreLastData();
        });

        // Request scan results when the webview loads
        window.addEventListener('DOMContentLoaded', () => {
            if (lastData && lastCommand) {
                restoreLastData();
            } else {
                scanDependencies();
            }
        });
    `;
};
