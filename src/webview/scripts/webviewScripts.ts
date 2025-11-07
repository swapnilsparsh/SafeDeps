import { getEcosystemDropdownButtonScript } from "../components/EcosystemDropdown";
import { getFilterUtilityScript } from "../components/FilterUtils";

export const getWebviewJavaScript = (): string => {
  return `
        const vscode = acquireVsCodeApi();

        let isLoading = false;
        let lastData = null;
        let lastCommand = null;
        let currentFilter = 'all'; // 'all', 'vulnerable', 'critical', 'high', 'medium', 'low'
        let currentScanType = null; // Tracks the current scan type during loading
        let lastProgress = null; // Tracks the last progress update
        let loadingStateTimestamp = null; // Timestamp when loading state was set

        const LOADING_STATE_TIMEOUT = 60000; // 60 seconds - consider loading state stale after this

        function scanDependencies() {
            if (isLoading) return;

            setLoadingState(true);
            lastCommand = 'scanDependencies';
            currentScanType = 'scanDependencies';
            lastProgress = null;
            loadingStateTimestamp = Date.now(); // Set timestamp
            saveWebviewState(); // Save loading state
            document.getElementById('content').innerHTML = \`
                <div class="loading">
                    <div class="loading-spinner"></div>
                    <div>Scanning workspace...</div>
                </div>
            \`;
            vscode.postMessage({ command: 'scanDependencies' });
        }

        function scanAllEcosystems() {
            if (isLoading) return;

            setLoadingState(true);
            lastCommand = 'scanAllEcosystems';
            currentScanType = 'allEcosystems';
            lastProgress = null;
            loadingStateTimestamp = Date.now(); // Set timestamp
            saveWebviewState(); // Save loading state
            document.getElementById('content').innerHTML = \`
                <div class="loading">
                    <div class="loading-spinner"></div>
                    <div id="progress-message" style="font-size: 14px; font-weight: 500; margin-bottom: 4px;">🚀 Initializing scan...</div>
                    <div id="progress-bar-container" style="width: 100%; max-width: 500px; height: 10px; background-color: rgba(255, 255, 255, 0.1); border-radius: 5px; margin-top: 16px; overflow: hidden; box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);">
                        <div id="progress-bar" style="height: 100%; width: 0%; background: linear-gradient(90deg, #007acc, #00a8e8); transition: width 0.3s ease, background 0.5s ease; border-radius: 5px;"></div>
                    </div>
                    <div id="progress-details" style="margin-top: 10px; font-size: 12px; color: rgba(255, 255, 255, 0.7); font-family: 'SF Mono', Monaco, 'Courier New', monospace;"></div>
                    <div id="progress-extra-info" style="margin-top: 8px; font-size: 11px; color: rgba(255, 255, 255, 0.5); font-style: italic; min-height: 16px;"></div>
                </div>
            \`;
            vscode.postMessage({ command: 'scanAllEcosystems' });
        }

        function restoreLoadingState(scanType, progress) {
            setLoadingState(true);

            // Determine the scan type and set appropriate command
            if (scanType.startsWith('ecosystem:')) {
                lastCommand = 'scanEcosystem';
                const ecosystem = scanType.split(':')[1];
                document.getElementById('content').innerHTML = \`
                    <div class="loading">
                        <div class="loading-spinner"></div>
                        <div id="progress-message" style="font-size: 14px; font-weight: 500; margin-bottom: 4px;">\${progress ? progress.message : '🚀 Scanning \${ecosystem}...'}</div>
                        <div id="progress-bar-container" style="width: 100%; max-width: 500px; height: 10px; background-color: rgba(255, 255, 255, 0.1); border-radius: 5px; margin-top: 16px; overflow: hidden; box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);">
                            <div id="progress-bar" style="height: 100%; width: \${progress ? progress.percentage : 0}%; background: linear-gradient(90deg, #007acc, #00a8e8); transition: width 0.3s ease, background 0.5s ease; border-radius: 5px;"></div>
                        </div>
                        <div id="progress-details" style="margin-top: 10px; font-size: 12px; color: rgba(255, 255, 255, 0.7); font-family: 'SF Mono', Monaco, 'Courier New', monospace;"></div>
                        <div id="progress-extra-info" style="margin-top: 8px; font-size: 11px; color: rgba(255, 255, 255, 0.5); font-style: italic; min-height: 16px;"></div>
                    </div>
                \`;
            } else if (scanType === 'allEcosystems') {
                lastCommand = 'scanAllEcosystems';
                document.getElementById('content').innerHTML = \`
                    <div class="loading">
                        <div class="loading-spinner"></div>
                        <div id="progress-message" style="font-size: 14px; font-weight: 500; margin-bottom: 4px;">\${progress ? progress.message : '🚀 Scanning all ecosystems...'}</div>
                        <div id="progress-bar-container" style="width: 100%; max-width: 500px; height: 10px; background-color: rgba(255, 255, 255, 0.1); border-radius: 5px; margin-top: 16px; overflow: hidden; box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);">
                            <div id="progress-bar" style="height: 100%; width: \${progress ? progress.percentage : 0}%; background: linear-gradient(90deg, #007acc, #00a8e8); transition: width 0.3s ease, background 0.5s ease; border-radius: 5px;"></div>
                        </div>
                        <div id="progress-details" style="margin-top: 10px; font-size: 12px; color: rgba(255, 255, 255, 0.7); font-family: 'SF Mono', Monaco, 'Courier New', monospace;"></div>
                        <div id="progress-extra-info" style="margin-top: 8px; font-size: 11px; color: rgba(255, 255, 255, 0.5); font-style: italic; min-height: 16px;"></div>
                    </div>
                \`;
            }

            // If we have progress data, update the UI with it
            if (progress) {
                updateProgress(progress);
            }
        }

        function updateProgress(progress) {
            // Save progress state
            lastProgress = progress;
            saveWebviewState();

            const messageEl = document.getElementById('progress-message');
            const barEl = document.getElementById('progress-bar');
            const detailsEl = document.getElementById('progress-details');
            const extraInfoEl = document.getElementById('progress-extra-info');

            if (messageEl) {
                messageEl.textContent = progress.message;
            }

            if (barEl) {
                barEl.style.width = \`\${progress.percentage}%\`;

                // Change color based on progress
                if (progress.percentage >= 90) {
                    barEl.style.background = 'linear-gradient(90deg, #28a745, #20c997)'; // Green
                } else if (progress.percentage >= 65) {
                    barEl.style.background = 'linear-gradient(90deg, #007acc, #00a8e8)'; // Blue
                } else {
                    barEl.style.background = 'linear-gradient(90deg, #007acc, #0087d1)'; // Lighter blue
                }
            }

            if (detailsEl) {
                const detailParts = [];

                // Show current/total
                if (progress.current !== undefined && progress.total !== undefined) {
                    detailParts.push(\`\${progress.current} / \${progress.total}\`);
                }

                // Show percentage
                detailParts.push(\`\${progress.percentage}%\`);

                // Show elapsed time
                if (progress.elapsedTime) {
                    const seconds = Math.floor(progress.elapsedTime / 1000);
                    if (seconds < 60) {
                        detailParts.push(\`⏱️ \${seconds}s\`);
                    } else {
                        const minutes = Math.floor(seconds / 60);
                        const remainingSeconds = seconds % 60;
                        detailParts.push(\`⏱️ \${minutes}m \${remainingSeconds}s\`);
                    }
                }

                // Show estimated time remaining
                if (progress.estimatedTimeRemaining && progress.estimatedTimeRemaining > 1000) {
                    const seconds = Math.floor(progress.estimatedTimeRemaining / 1000);
                    if (seconds < 60) {
                        detailParts.push(\`⏳ ~\${seconds}s left\`);
                    } else {
                        const minutes = Math.floor(seconds / 60);
                        detailParts.push(\`⏳ ~\${minutes}m left\`);
                    }
                }

                detailsEl.textContent = detailParts.join(' • ');
            }

            // Show extra information
            if (extraInfoEl) {
                const extraParts = [];

                // Show file/package details
                if (progress.details) {
                    extraParts.push(progress.details);
                }

                // Show statistics
                if (progress.statistics) {
                    const stats = [];
                    if (progress.statistics.dependenciesFound > 0) {
                        stats.push(\`📦 \${progress.statistics.dependenciesFound} deps\`);
                    }
                    if (progress.statistics.vulnerabilitiesFound > 0) {
                        stats.push(\`🚨 \${progress.statistics.vulnerabilitiesFound} vulns\`);
                    }
                    if (stats.length > 0) {
                        extraParts.push(stats.join(' • '));
                    }
                }

                // Show performance metric
                if (progress.packagesPerSecond && progress.packagesPerSecond > 0) {
                    const pps = Math.round(progress.packagesPerSecond * 10) / 10;
                    extraParts.push(\`⚡ \${pps} pkg/s\`);
                }

                extraInfoEl.textContent = extraParts.join(' | ');
                extraInfoEl.style.display = extraParts.length > 0 ? 'block' : 'none';
            }
        }

        function setLoadingState(loading) {
            isLoading = loading;
            const scanButton = document.querySelector('button[onclick="scanDependencies()"]');
            const allEcosystemsButton = document.querySelector('button[onclick="scanAllEcosystems()"]');
            const ecosystemBtn = document.getElementById('ecosystemBtn');

            [scanButton, allEcosystemsButton, ecosystemBtn].forEach(element => {
                if (element) {
                    element.disabled = loading;
                    element.style.opacity = loading ? '0.6' : '1';
                    element.style.cursor = loading ? 'not-allowed' : 'pointer';
                }
            });
        }

        function restoreLastData() {
            if (lastData && lastCommand) {
                // Don't reset loading state if we're currently in a loading operation
                const resetLoadingState = !isLoading;

                if (lastCommand === 'scanDependencies') {
                    renderDependencies(lastData, resetLoadingState);
                } else if (lastCommand === 'scanEcosystem') {
                    renderEcosystemDependencies(lastData, resetLoadingState);
                } else if (lastCommand === 'scanAllEcosystems') {
                    renderAllEcosystemsDependencies(lastData, resetLoadingState);
                }
            }
        }

        function setFilter(filter) {
            currentFilter = filter;

            // Update active state for all filter buttons
            document.querySelectorAll('.filter-button').forEach(btn => {
                btn.classList.remove('active');
            });

            // Find and activate the selected filter button
            const filterButton = document.querySelector(\`[data-filter="\${filter}"]\`);
            if (filterButton) {
                filterButton.classList.add('active');
            }

            // Just reapply the filter without full re-render
            if (typeof applySearchFilter === 'function') {
                applySearchFilter();
            }
        }

        // Backward compatibility functions
        function setVulnerabilityFilter(filter) {
            setFilter(filter);
        }

        function setEcosystemFilter(filter) {
            setFilter(filter);
        }

        function shouldShowDependency(dep) {
            // First check if it matches the search query
            if (typeof matchesSearchQuery === 'function' && !matchesSearchQuery(dep)) {
                return false;
            }

            if (currentFilter === 'all') return true;

            if (currentFilter === 'vulnerable') {
                return dep.vulnerabilities && dep.vulnerabilities.length > 0;
            }

            if (currentFilter === 'outdated') {
                return dep.metadata && dep.metadata.isOutdated;
            }

            if (currentFilter === 'unknown-license') {
                return dep.metadata && dep.metadata.hasUnknownLicense;
            }

            // Handle severity-based filters
            const severityFilter = currentFilter.toUpperCase();
            return dep.vulnerabilities && dep.vulnerabilities.some(vuln =>
                vuln.severity && vuln.severity.toUpperCase() === severityFilter
            );
        }

        function clearFilters() {
            setFilter('all');
        }

        function getFilterCount(filter) {
            if (!lastData) return 0;

            let count = 0;
            if (lastCommand === 'scanEcosystem' || lastCommand === 'scanAllEcosystems') {
                lastData.files.forEach(fileData => {
                    count += fileData.dependencies.filter(dep => {
                        const tempFilter = currentFilter;
                        currentFilter = filter;
                        const result = shouldShowDependency(dep);
                        currentFilter = tempFilter;
                        return result;
                    }).length;
                });
            }
            return count;
        }

        function openFile(filePath) {
            vscode.postMessage({ command: 'openFile', filePath: filePath });
        }

        function toggleFileDetails(filePath) {
            const sanitizedPath = filePath.replace(/[^a-zA-Z0-9]/g, '_');
            const depsContainer = document.getElementById(\`deps-\${sanitizedPath}\`);
            const toggleIcon = document.getElementById(\`toggle-\${sanitizedPath}\`);

            if (depsContainer && toggleIcon) {
                if (depsContainer.style.display === 'none') {
                    depsContainer.style.display = 'block';
                    toggleIcon.textContent = '▲';
                } else {
                    depsContainer.style.display = 'none';
                    toggleIcon.textContent = '▼';
                }
            }
        }

        function expandAllFiles() {
            document.querySelectorAll('.file-dependencies').forEach(container => {
                container.style.display = 'block';
            });
            document.querySelectorAll('.toggle-icon').forEach(icon => {
                icon.textContent = '▲';
            });
        }

        function collapseAllFiles() {
            document.querySelectorAll('.file-dependencies').forEach(container => {
                container.style.display = 'none';
            });
            document.querySelectorAll('.toggle-icon').forEach(icon => {
                icon.textContent = '▼';
            });
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

        function getRegistryUrl(packageName, ecosystem) {
            const registryUrls = {
                'npm': (name) => \`https://www.npmjs.com/package/\${encodeURIComponent(name)}\`,
                'PyPI': (name) => \`https://pypi.org/project/\${encodeURIComponent(name)}/\`,
                'Go': (name) => \`https://pkg.go.dev/\${encodeURIComponent(name)}\`,
                'crates.io': (name) => \`https://crates.io/crates/\${encodeURIComponent(name)}\`,
                'Maven': (name) => {
                    // For Maven, we need to handle group:artifact format
                    // If it contains a colon, split it; otherwise assume it's just the artifact
                    if (name.includes(':')) {
                        const [group, artifact] = name.split(':');
                        return \`https://mvnrepository.com/artifact/\${encodeURIComponent(group)}/\${encodeURIComponent(artifact)}\`;
                    }
                    return \`https://mvnrepository.com/search?q=\${encodeURIComponent(name)}\`;
                },
                'RubyGems': (name) => \`https://rubygems.org/gems/\${encodeURIComponent(name)}\`,
                'Packagist': (name) => \`https://packagist.org/packages/\${encodeURIComponent(name)}\`
            };

            // Handle ecosystem aliases
            const ecosystemMap = {
                'javascript': 'npm',
                'typescript': 'npm',
                'JavaScript/TypeScript': 'npm',
                'python': 'PyPI',
                'Python': 'PyPI',
                'go': 'Go',
                'golang': 'Go',
                'rust': 'crates.io',
                'Rust': 'crates.io',
                'crates': 'crates.io',
                'java': 'Maven',
                'Java': 'Maven',
                'ruby': 'RubyGems',
                'Ruby': 'RubyGems',
                'php': 'Packagist',
                'PHP': 'Packagist'
            };

            const normalizedEcosystem = ecosystemMap[ecosystem] || ecosystem;
            const urlGenerator = registryUrls[normalizedEcosystem];

            if (urlGenerator) {
                return urlGenerator(packageName);
            }

            // Fallback for unknown ecosystems
            return null;
        }

        function openPackageRegistry(packageName, ecosystem) {
            const url = getRegistryUrl(packageName, ecosystem);
            if (url) {
                vscode.postMessage({
                    command: 'openUrl',
                    url: url
                });
            }
        }

        function renderDependencies(summary, resetLoadingState = true) {
            if (resetLoadingState) {
                setLoadingState(false);
            }
            lastData = summary;
            lastCommand = 'scanDependencies';
            currentScanType = null; // Clear scan type
            lastProgress = null; // Clear progress
            loadingStateTimestamp = null; // Clear timestamp
            saveWebviewState();

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
                        across \${Object.keys(summary.filesByLanguage).length} ecosystem\${Object.keys(summary.filesByLanguage).length !== 1 ? 's' : ''}
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

                // Map technical language names to user-friendly ecosystem names
                const ecosystemDisplayNames = {
                    'JavaScript/TypeScript': 'npm (Node.js)',
                    'Python': 'PyPI (Python)',
                    'Java': 'Maven (Java)',
                    'Go': 'Go Modules',
                    'Rust': 'Crates.io (Rust)',
                    'Ruby': 'RubyGems (Ruby)',
                    'PHP': 'Packagist (PHP)'
                };

                const displayName = ecosystemDisplayNames[language] || language;

                html += \`
                    <div class="language-group">
                        <div class="language-header">\${displayName} (\${files.length})</div>
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

            // Update available ecosystems for dropdown
            updateAvailableEcosystemsFromSummary(summary);

            // Reapply search filter after rendering
            if (typeof applySearchFilter === 'function') {
                applySearchFilter();
            }
        }

        function updateAvailableEcosystemsFromSummary(summary) {
            if (!summary || !summary.filesByLanguage) return;

            console.log('Summary data:', summary);

            const ecosystems = Object.keys(summary.filesByLanguage).sort();
            const filesByEcosystem = {};

            // Count files per ecosystem
            Object.keys(summary.filesByLanguage).forEach(ecosystem => {
                filesByEcosystem[ecosystem] = summary.filesByLanguage[ecosystem];
            });

            console.log('Detected ecosystems:', ecosystems);
            console.log('Files by ecosystem:', filesByEcosystem);

            if (typeof updateAvailableEcosystems === 'function') {
                updateAvailableEcosystems(ecosystems, filesByEcosystem);
            }
        }

        function renderEcosystemDependencies(summary, resetLoadingState = true) {
            if (resetLoadingState) {
                setLoadingState(false);
            }
            lastData = summary;
            lastCommand = 'scanEcosystem';
            currentScanType = null; // Clear scan type
            lastProgress = null; // Clear progress
            loadingStateTimestamp = null; // Clear timestamp
            saveWebviewState();

            const content = document.getElementById('content');

            if (summary.totalFiles === 0) {
                content.innerHTML = \`
                    <div class="empty-state">
                        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <div>No \${summary.ecosystem} files found in workspace</div>
                    </div>
                \`;
                return;
            }

            const hasVulnerabilities = summary.vulnerablePackages > 0;
            const hasOutdated = summary.outdatedPackages > 0;
            const hasUnknownLicense = summary.unknownLicensePackages > 0;
            const hasAlerts = hasVulnerabilities || hasOutdated || hasUnknownLicense;

            let html = \`
                <div class="summary">
                    <div class="summary-title">\${summary.ecosystem} Ecosystem Analysis</div>
                    <div class="summary-stats">
                        Found \${summary.totalDependencies} dependencies in \${summary.totalFiles} \${summary.ecosystem} file\${summary.totalFiles !== 1 ? 's' : ''}
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
                        \${hasOutdated ? '⚠️ ' + summary.outdatedPackages + ' outdated package' + (summary.outdatedPackages !== 1 ? 's' : '') : ''}
                        \${hasUnknownLicense ? (hasOutdated ? '<br>' : '') + '❓ ' + summary.unknownLicensePackages + ' package' + (summary.unknownLicensePackages !== 1 ? 's' : '') + ' with unknown license' : ''}
                        \${hasVulnerabilities ? (hasOutdated || hasUnknownLicense ? '<br>' : '') + '🚨 ' + summary.vulnerablePackages + ' vulnerable package' + (summary.vulnerablePackages !== 1 ? 's' : '') : ''}
                    </div>
                </div>
                \${typeof renderFilterBar === 'function' ? renderFilterBar(summary, hasVulnerabilities, hasOutdated, hasUnknownLicense) : ''}
                <div class="action-bar">
                    <button class="action-button" onclick="expandAllFiles()">📂 Expand All</button>
                    <button class="action-button" onclick="collapseAllFiles()">📁 Collapse All</button>
                </div>
                <div class="dependency-files">
            \`;

            summary.files.forEach(fileData => {
                const file = fileData.file;
                const allDeps = fileData.dependencies;
                const filteredDeps = allDeps.filter(dep => shouldShowDependency(dep));

                // Skip files with no matching dependencies when filtering
                if (currentFilter !== 'all' && filteredDeps.length === 0) {
                    return;
                }

                const totalDeps = allDeps.length;
                const vulnerableDeps = allDeps.filter(dep => dep.vulnerabilities && dep.vulnerabilities.length > 0);
                const outdatedDeps = allDeps.filter(dep => dep.metadata && dep.metadata.isOutdated);
                const unknownLicenseDeps = allDeps.filter(dep => dep.metadata && dep.metadata.hasUnknownLicense);

                html += \`
                    <div class="language-group">
                        <div class="language-header" onclick="toggleFileDetails('\${file.filePath.replace(/\\\\/g, '\\\\\\\\')}')">
                            <div class="language-header-content">
                                <span class="file-icon">\${getFileIcon(file.type)}</span>
                                \${file.type} (\${currentFilter === 'all' ? totalDeps : filteredDeps.length}\${currentFilter !== 'all' ? '/' + totalDeps : ''} deps)
                                <div style="font-size: 11px; color: var(--vscode-descriptionForeground); font-weight: normal;">
                                    \${file.relativePath}
                                    \${vulnerableDeps.length > 0 ? \`<span class="vulnerability-warning"> • \${vulnerableDeps.length} vulnerable</span>\` : ''}
                                    \${outdatedDeps.length > 0 ? \`<span class="outdated-warning"> • \${outdatedDeps.length} outdated</span>\` : ''}
                                    \${unknownLicenseDeps.length > 0 ? \`<span class="license-warning"> • \${unknownLicenseDeps.length} unknown license</span>\` : ''}
                                </div>
                            </div>
                            <span class="toggle-icon" id="toggle-\${file.filePath.replace(/[^a-zA-Z0-9]/g, '_')}">▼</span>
                        </div>
                        <div class="file-dependencies" id="deps-\${file.filePath.replace(/[^a-zA-Z0-9]/g, '_')}" style="display: none;">
            \`;

                // Group dependencies by type
                const depTypes = ['dependency', 'devDependency', 'peerDependency', 'optionalDependency'];
                const typeLabels = {
                    'dependency': 'Dependencies',
                    'devDependency': 'Dev Dependencies',
                    'peerDependency': 'Peer Dependencies',
                    'optionalDependency': 'Optional Dependencies'
                };

                depTypes.forEach(type => {
                    const depsOfType = fileData.dependencies.filter(dep => dep.type === type && shouldShowDependency(dep));
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
                                    const highlight = typeof highlightSearchTerm === 'function' ? highlightSearchTerm : (text) => text;
                                    dep.vulnerabilities.forEach(vuln => {
                                        const cveText = vuln.cveIds.length > 0 ? '(' + vuln.cveIds.join(', ') + ')' : '';
                                        vulnerabilityInfo += \`
                                            <div class="vulnerability-item">
                                                <div class="vulnerability-cve">\${highlight(vuln.id)} \${highlight(cveText)}</div>
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
                                            <span class="package-name-clickable" onclick="openPackageRegistry('\${dep.name.replace(/'/g, "\\'")}', '\${summary.ecosystem}')" title="Open in \${summary.ecosystem} registry">
                                                \${typeof highlightSearchTerm === 'function' ? highlightSearchTerm(dep.name) : dep.name}
                                            </span>
                                            \${alertBadges}
                                        </div>
                                        <div class="file-path">\${typeof highlightSearchTerm === 'function' ? highlightSearchTerm(dep.version) : dep.version}</div>
                                        \${metadata ? renderPackageMetadata(metadata) : '<div class="package-metadata">Metadata unavailable for \${summary.ecosystem}</div>'}
                                        \${vulnerabilityInfo}
                                    </div>
                                </div>
                            \`;
                        });

                        html += '</div>';
                    }
                });

                html += '</div></div>';
            });

            html += '</div>';
            content.innerHTML = html;

            // Reapply search filter after rendering
            if (typeof applySearchFilter === 'function') {
                applySearchFilter();
            }
        }

        function renderPackageMetadata(metadata) {
            if (!metadata) {
                return '<div class="package-metadata">Metadata unavailable</div>';
            }

            const sizeClass = getSizeClass(metadata.size);
            const formattedSize = formatBytes(metadata.size);
            const lastUpdated = formatDate(new Date(metadata.lastUpdated));

            // Highlight function
            const highlight = typeof highlightSearchTerm === 'function' ? highlightSearchTerm : (text) => text;

            // Only show size if it's available (not -1)
            const sizeHtml = formattedSize ? \`
                <div class="metadata-item">
                    <span class="size-indicator \${sizeClass}"></span>
                    <span>\${formattedSize}</span>
                </div>
            \` : '';

            return \`
                <div class="package-metadata">
                    \${sizeHtml}
                    <div class="metadata-item">
                        📄 \${highlight(metadata.license)}
                    </div>
                    <div class="metadata-item">
                        📅 \${lastUpdated}
                    </div>
                    \${metadata.author ? \`<div class="metadata-item">👤 \${highlight(metadata.author)}</div>\` : ''}
                </div>
            \`;
        }

        function getSizeClass(size) {
            if (size < 0) return ''; // Size unavailable, no class needed
            if (size < 50000) return 'size-small';
            if (size < 500000) return 'size-medium';
            if (size < 5000000) return 'size-large';
            return 'size-huge';
        }

        function formatBytes(bytes) {
            if (bytes < 0) return null; // Size unavailable
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

        function renderAllEcosystemsDependencies(summary, resetLoadingState = true) {
            if (resetLoadingState) {
                setLoadingState(false);
            }
            lastData = summary;
            lastCommand = 'scanAllEcosystems';
            currentScanType = null; // Clear scan type
            lastProgress = null; // Clear progress
            loadingStateTimestamp = null; // Clear timestamp
            saveWebviewState();

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
            const hasOutdated = summary.outdatedPackages > 0;
            const hasUnknownLicense = summary.unknownLicensePackages > 0;
            const hasAlerts = hasVulnerabilities || hasOutdated || hasUnknownLicense;

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
                    <div class="summary-alerts \${hasAlerts ? '' : 'hidden'}">
                        \${hasOutdated ? '⚠️ ' + summary.outdatedPackages + ' outdated package' + (summary.outdatedPackages !== 1 ? 's' : '') : ''}
                        \${hasUnknownLicense ? (hasOutdated ? '<br>' : '') + '❓ ' + summary.unknownLicensePackages + ' package' + (summary.unknownLicensePackages !== 1 ? 's' : '') + ' with unknown license' : ''}
                        \${hasVulnerabilities ? (hasOutdated || hasUnknownLicense ? '<br>' : '') + '🚨 ' + summary.vulnerablePackages + ' vulnerable package' + (summary.vulnerablePackages !== 1 ? 's' : '') : ''}
                    </div>
                </div>
                \${typeof renderFilterBar === 'function' ? renderFilterBar(summary, hasVulnerabilities, hasOutdated, hasUnknownLicense) : ''}
                <div class="action-bar">
                    <button class="action-button" onclick="expandAllFiles()">📂 Expand All</button>
                    <button class="action-button" onclick="collapseAllFiles()">📁 Collapse All</button>
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
                    const allDeps = fileData.dependencies;
                    const filteredDeps = allDeps.filter(dep => shouldShowDependency(dep));

                    // Skip files with no matching dependencies when filtering
                    if (currentFilter !== 'all' && filteredDeps.length === 0) {
                        return;
                    }

                    const totalDeps = allDeps.length;
                    const vulnerableDeps = allDeps.filter(dep => dep.vulnerabilities && dep.vulnerabilities.length > 0);
                    const outdatedDeps = allDeps.filter(dep => dep.metadata && dep.metadata.isOutdated);
                    const unknownLicenseDeps = allDeps.filter(dep => dep.metadata && dep.metadata.hasUnknownLicense);

                    html += \`
                        <div class="language-group">
                            <div class="language-header" onclick="toggleFileDetails('\${file.filePath.replace(/\\\\/g, '\\\\\\\\')}')">
                                <div class="language-header-content">
                                    <span class="file-icon">\${getFileIcon(file.type)}</span>
                                    \${file.type} (\${currentFilter === 'all' ? totalDeps : filteredDeps.length}\${currentFilter !== 'all' ? '/' + totalDeps : ''} deps)
                                    <div style="font-size: 11px; color: var(--vscode-descriptionForeground); font-weight: normal;">
                                        \${file.relativePath}
                                        \${vulnerableDeps.length > 0 ? \`<span class="vulnerability-warning"> • \${vulnerableDeps.length} vulnerable</span>\` : ''}
                                        \${outdatedDeps.length > 0 ? \`<span class="outdated-warning"> • \${outdatedDeps.length} outdated</span>\` : ''}
                                        \${unknownLicenseDeps.length > 0 ? \`<span class="license-warning"> • \${unknownLicenseDeps.length} unknown license</span>\` : ''}
                                    </div>
                                </div>
                                <span class="toggle-icon" id="toggle-\${file.filePath.replace(/[^a-zA-Z0-9]/g, '_')}">▼</span>
                            </div>
                            <div class="file-dependencies" id="deps-\${file.filePath.replace(/[^a-zA-Z0-9]/g, '_')}" style="display: none;">
                \`;

                    // Group dependencies by type
                    const depTypes = ['dependency', 'devDependency', 'peerDependency', 'optionalDependency'];
                    const typeLabels = {
                        'dependency': 'Dependencies',
                        'devDependency': 'Dev Dependencies',
                        'peerDependency': 'Peer Dependencies',
                        'optionalDependency': 'Optional Dependencies'
                    };

                    depTypes.forEach(type => {
                        const depsOfType = fileData.dependencies.filter(dep => dep.type === type && shouldShowDependency(dep));
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
                                                <span class="package-name-clickable" onclick="openPackageRegistry('\${dep.name.replace(/'/g, "\\'")}', '\${ecosystem}')" title="Open in \${ecosystem} registry">
                                                    \${dep.name}
                                                </span>
                                                \${alertBadges}
                                            </div>
                                            <div class="file-path">\${dep.version}</div>
                                            \${metadata ? renderPackageMetadata(metadata) : '<div class="package-metadata">Metadata unavailable for \${ecosystem}</div>'}
                                            \${vulnerabilityInfo}
                                        </div>
                                    </div>
                                \`;
                            });

                            html += '</div>';
                        }
                    });

                    html += '</div></div>';
                });

                html += '</div>';
            });

            html += '</div>';
            content.innerHTML = html;

            // Reapply search filter after rendering
            if (typeof applySearchFilter === 'function') {
                applySearchFilter();
            }
        }

        // Handle messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'updateDependencies':
                    renderDependencies(message.data);
                    break;
                case 'updateEcosystemDependencies':
                    renderEcosystemDependencies(message.data);
                    break;
                case 'updateAllEcosystemsDependencies':
                    renderAllEcosystemsDependencies(message.data);
                    break;
                case 'updateProgress':
                    updateProgress(message.progress);
                    break;
                case 'restoreLoadingState':
                    restoreLoadingState(message.scanType, message.progress);
                    break;
                case 'showError':
                    showError(message.error);
                    break;
                case 'autoScan':
                    // Trigger automatic scan if no saved state exists
                    if (!lastData && !isLoading) {
                        scanDependencies();
                    }
                    break;
                case 'updateGitignoreSetting':
                    // Update the toggle when setting changes from extension
                    const toggle = document.getElementById('respectGitignoreToggle');
                    if (toggle) {
                        toggle.checked = message.value;
                    }
                    // Save in webview state
                    const state = vscode.getState() || {};
                    state.respectGitignore = message.value;
                    vscode.setState(state);
                    break;
                    break;
            }
        });

        window.addEventListener('focus', () => {
            restoreLastData();
        });

        // Request scan results when the webview loads
        // Initialize filter state and add keyboard shortcuts
        window.addEventListener('DOMContentLoaded', () => {
            // First, restore state from VS Code storage
            restoreWebviewState();

            // Initialize settings UI
            initializeSettings();

            // If we have a loading state, restore it but also request backend state
            // in case the scan completed while we were away
            if (isLoading && currentScanType) {
                restoreLoadingState(currentScanType, lastProgress);
                // Request backend to send results if available (prevents stuck loading state)
                vscode.postMessage({ command: 'restoreData' });
            } else if (lastData && lastCommand) {
                // Otherwise restore completed scan data
                restoreLastData();
            } else {
                // Only scan if we don't have any saved state
                scanDependencies();
            }

            // Add keyboard shortcuts for filters
            document.addEventListener('keydown', (event) => {
                if (event.ctrlKey || event.metaKey) {
                    switch (event.key) {
                        case '1':
                            event.preventDefault();
                            setFilter('all');
                            break;
                        case '2':
                            event.preventDefault();
                            if (document.querySelector('[data-filter="vulnerable"]')) {
                                setFilter('vulnerable');
                            }
                            break;
                        case '3':
                            event.preventDefault();
                            if (document.querySelector('[data-filter="critical"]')) {
                                setFilter('critical');
                            }
                            break;
                        case '0':
                            event.preventDefault();
                            clearFilters();
                            break;
                    }
                }
            });
        });

        // Persist filter state in VS Code state
        function saveFilterState() {
            const state = vscode.getState() || {};
            state.currentFilter = currentFilter;
            vscode.setState(state);
        }

        function restoreFilterState() {
            const state = vscode.getState();
            if (state && state.currentFilter) {
                currentFilter = state.currentFilter;
            }
        }

        // Settings Management
        let settingsVisible = false;

        function toggleSettings() {
            const settingsPanel = document.getElementById('settings-panel');
            settingsVisible = !settingsVisible;

            if (settingsPanel) {
                settingsPanel.style.display = settingsVisible ? 'block' : 'none';
            }

            // Save settings visibility state
            const state = vscode.getState() || {};
            state.settingsVisible = settingsVisible;
            vscode.setState(state);
        }

        function handleGitignoreToggle(checked) {
            // Send message to extension to update the configuration
            vscode.postMessage({
                command: 'updateGitignoreSetting',
                value: checked
            });

            // Save the setting in webview state as well
            const state = vscode.getState() || {};
            state.respectGitignore = checked;
            vscode.setState(state);

            // Show a subtle notification
            showSettingUpdateNotification(checked);

            // Auto-rescan to show immediate effect
            autoRescanAfterSettingChange(checked);
        }

        function autoRescanAfterSettingChange(enabled) {
            // Don't rescan if already loading
            if (isLoading) {
                return;
            }

            // Small delay to let the notification show and setting save
            setTimeout(() => {
                // Trigger rescan based on last scan type, or default to scanDependencies
                if (lastCommand === 'scanAllEcosystems') {
                    scanAllEcosystems();
                } else if (lastCommand === 'scanEcosystem' && currentScanType && currentScanType.startsWith('ecosystem:')) {
                    const ecosystem = currentScanType.split(':')[1];
                    scanEcosystem(ecosystem);
                } else {
                    // Default to basic workspace scan
                    scanDependencies();
                }
            }, 300); // Small delay for better UX (notification appears first)
        }

        function showSettingUpdateNotification(enabled) {
            const notification = document.createElement('div');
            notification.style.cssText = \`
                position: fixed;
                top: 60px;
                right: 20px;
                background: var(--vscode-notifications-background);
                color: var(--vscode-notifications-foreground);
                border: 1px solid var(--vscode-notifications-border);
                padding: 12px 16px;
                border-radius: 4px;
                font-size: 12px;
                z-index: 1000;
                animation: slideInRight 0.3s ease-out;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            \`;
            notification.innerHTML = enabled
                ? '<div>✓ .gitignore respect enabled</div><div style="font-size: 10px; margin-top: 4px; opacity: 0.8;">Rescanning...</div>'
                : '<div>✗ .gitignore respect disabled</div><div style="font-size: 10px; margin-top: 4px; opacity: 0.8;">Rescanning...</div>';

            document.body.appendChild(notification);

            setTimeout(() => {
                notification.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            }, 2000);
        }

        function initializeSettings() {
            // Get the current setting from workspace configuration
            vscode.postMessage({ command: 'getGitignoreSetting' });

            // Restore settings visibility from state
            const state = vscode.getState();
            if (state && state.settingsVisible !== undefined) {
                settingsVisible = state.settingsVisible;
                const settingsPanel = document.getElementById('settings-panel');
                if (settingsPanel) {
                    settingsPanel.style.display = settingsVisible ? 'block' : 'none';
                }
            }

            // Restore the toggle state if saved
            if (state && state.respectGitignore !== undefined) {
                const toggle = document.getElementById('respectGitignoreToggle');
                if (toggle) {
                    toggle.checked = state.respectGitignore;
                }
            }
        }

        // Persist webview data state in VS Code state
        function saveWebviewState() {
            const state = vscode.getState() || {};
            state.lastData = lastData;
            state.lastCommand = lastCommand;
            state.currentFilter = currentFilter;
            state.searchQuery = typeof filterState !== 'undefined' ? filterState.searchQuery : '';
            state.isLoading = isLoading;
            state.currentScanType = currentScanType;
            state.lastProgress = lastProgress;
            state.loadingStateTimestamp = isLoading ? Date.now() : null; // Save timestamp when loading
            vscode.setState(state);
        }

        function restoreWebviewState() {
            const state = vscode.getState();
            if (state) {
                if (state.lastData) {
                    lastData = state.lastData;
                }
                if (state.lastCommand) {
                    lastCommand = state.lastCommand;
                }
                if (state.currentFilter) {
                    currentFilter = state.currentFilter;
                }
                if (state.searchQuery && typeof filterState !== 'undefined') {
                    filterState.searchQuery = state.searchQuery;
                }

                // Check if loading state is stale
                if (state.isLoading !== undefined) {
                    const timestamp = state.loadingStateTimestamp || 0;
                    const now = Date.now();
                    const isStale = (now - timestamp) > LOADING_STATE_TIMEOUT;

                    if (isStale) {
                        // Loading state is stale, clear it
                        console.log('[SafeDeps] Loading state is stale, clearing...');
                        isLoading = false;
                        currentScanType = null;
                        lastProgress = null;
                        loadingStateTimestamp = null;
                    } else {
                        // Loading state is fresh, restore it
                        isLoading = state.isLoading;
                        loadingStateTimestamp = timestamp;
                        if (state.currentScanType) {
                            currentScanType = state.currentScanType;
                        }
                        if (state.lastProgress) {
                            lastProgress = state.lastProgress;
                        }
                    }
                }
            }
        }

        // Override setFilter to include state persistence
        const originalSetFilter = setFilter;
        setFilter = function(filter) {
            originalSetFilter(filter);
            saveWebviewState(); // Save entire state including filter
        };

        ${getEcosystemDropdownButtonScript()}
        ${getFilterUtilityScript()}
    `;
};
