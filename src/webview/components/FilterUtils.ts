/**
 * Filter utilities for the SafeDeps webview
 * Provides consistent filter functionality across different scan types
 */

export const getFilterUtilityScript = (): string => {
  return `
    // Filter state management
    let filterState = {
        current: 'all',
        history: ['all'],
        counts: {},
        searchQuery: ''
    };

    // Enhanced filter function with state management
    function setFilterWithHistory(filter) {
        if (filter !== filterState.current) {
            filterState.history.push(filterState.current);
            if (filterState.history.length > 10) {
                filterState.history.shift(); // Keep only last 10 filters
            }
        }

        filterState.current = filter;
        setFilter(filter);
        updateFilterCounts();
    }

    // Go back to previous filter
    function previousFilter() {
        if (filterState.history.length > 0) {
            const previousFilter = filterState.history.pop();
            filterState.current = previousFilter;
            setFilter(previousFilter);
            updateFilterCounts();
        }
    }

    // Update filter counts for better UX
    function updateFilterCounts() {
        if (!lastData) return;

        const filters = ['all', 'vulnerable', 'outdated', 'unknown-license', 'critical', 'high', 'medium', 'low'];
        const counts = {};

        filters.forEach(filter => {
            counts[filter] = getFilterCount(filter);
        });

        filterState.counts = counts;

        // Update button labels with counts (if not already shown)
        document.querySelectorAll('.filter-button').forEach(btn => {
            const filterType = btn.getAttribute('data-filter');
            if (filterType && counts[filterType] !== undefined) {
                const currentText = btn.textContent;
                if (!currentText.includes('(') && filterType !== 'all') {
                    const baseText = currentText.split(' (')[0];
                    if (counts[filterType] > 0) {
                        btn.textContent = \`\${baseText} (\${counts[filterType]})\`;
                    }
                }
            }
        });
    }

    // Get filter suggestions based on current data
    function getFilterSuggestions() {
        if (!lastData || !lastData.vulnerabilityBreakdown) return [];

        const suggestions = [];
        const breakdown = lastData.vulnerabilityBreakdown;

        if (breakdown.critical > 0) suggestions.push({ filter: 'critical', count: breakdown.critical, priority: 4 });
        if (breakdown.high > 0) suggestions.push({ filter: 'high', count: breakdown.high, priority: 3 });
        if (breakdown.medium > 0) suggestions.push({ filter: 'medium', count: breakdown.medium, priority: 2 });
        if (breakdown.low > 0) suggestions.push({ filter: 'low', count: breakdown.low, priority: 1 });

        return suggestions.sort((a, b) => b.priority - a.priority);
    }

    // Smart filter recommendations
    function showFilterRecommendations() {
        const suggestions = getFilterSuggestions();
        if (suggestions.length === 0) return;

        const criticalCount = suggestions.find(s => s.filter === 'critical')?.count || 0;
        const highCount = suggestions.find(s => s.filter === 'high')?.count || 0;

        if (criticalCount > 0) {
            console.log(\`🚨 Recommendation: Focus on \${criticalCount} critical vulnerabilities first\`);
        } else if (highCount > 0) {
            console.log(\`⚠️ Recommendation: Address \${highCount} high-severity vulnerabilities\`);
        }
    }

    // Export filter state for debugging
    function getFilterState() {
        return {
            ...filterState,
            suggestions: getFilterSuggestions(),
            lastCommand: lastCommand,
            hasData: !!lastData
        };
    }

    // Search functionality
    function setSearchQuery(query) {
        filterState.searchQuery = query.toLowerCase().trim();

        // Save state if available
        if (typeof saveWebviewState === 'function') {
            saveWebviewState();
        }

        // Update search results count without full re-render
        updateSearchResultsDisplay();

        // Filter visible elements without recreating HTML
        applySearchFilter();
    }

    function updateSearchResultsDisplay() {
        const resultsCountEl = document.querySelector('.search-results-count');
        const clearBtn = document.querySelector('.search-clear-btn');

        if (filterState.searchQuery) {
            const count = getSearchMatchCount();
            if (resultsCountEl) {
                resultsCountEl.textContent = \`Found \${count} matching package\${count !== 1 ? 's' : ''}\`;
                resultsCountEl.style.display = 'block';
            }
            if (clearBtn) {
                clearBtn.style.display = 'block';
            }
        } else {
            if (resultsCountEl) {
                resultsCountEl.style.display = 'none';
            }
            if (clearBtn) {
                clearBtn.style.display = 'none';
            }
        }
    }

    function applySearchFilter() {
        // Get all package items
        const packageItems = document.querySelectorAll('.package-item');

        packageItems.forEach(item => {
            // Get the package data from the element's text content
            const nameEl = item.querySelector('.package-name-clickable');
            const versionEl = item.querySelector('.file-path');

            if (!nameEl) return;

            const name = nameEl.textContent.toLowerCase();
            const version = versionEl ? versionEl.textContent.toLowerCase() : '';

            let matchesSearch = true;
            let matchesFilter = true;

            // Check search query
            if (filterState.searchQuery) {
                const query = filterState.searchQuery;
                matchesSearch = name.includes(query) || version.includes(query);

                // Also check metadata if available
                const metadataEl = item.querySelector('.package-metadata');
                if (metadataEl && !matchesSearch) {
                    matchesSearch = metadataEl.textContent.toLowerCase().includes(query);
                }

                // Check vulnerability info
                const vulnEl = item.querySelector('.vulnerability-details');
                if (vulnEl && !matchesSearch) {
                    matchesSearch = vulnEl.textContent.toLowerCase().includes(query);
                }
            }

            // Check current filter
            if (currentFilter !== 'all') {
                const hasVulnBadge = item.querySelector('.vulnerability-badge');
                const hasOutdatedBadge = item.querySelector('.metadata-badge.outdated');
                const hasUnknownLicenseBadge = item.querySelector('.metadata-badge.unknown-license');

                if (currentFilter === 'vulnerable') {
                    matchesFilter = !!hasVulnBadge;
                } else if (currentFilter === 'outdated') {
                    matchesFilter = !!hasOutdatedBadge;
                } else if (currentFilter === 'unknown-license') {
                    matchesFilter = !!hasUnknownLicenseBadge;
                } else {
                    // Severity filters (critical, high, medium, low)
                    if (hasVulnBadge) {
                        const severityClass = currentFilter.toLowerCase();
                        matchesFilter = hasVulnBadge.classList.contains(severityClass);
                    } else {
                        matchesFilter = false;
                    }
                }
            }

            // Show/hide based on both search and filter matches
            if (matchesSearch && matchesFilter) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });

        // Update file group visibility
        updateFileGroupVisibility();
    }

    function updateFileGroupVisibility() {
        const fileGroups = document.querySelectorAll('.language-group');
        let totalVisibleItems = 0;

        fileGroups.forEach(group => {
            const depsContainer = group.querySelector('.file-dependencies');
            if (!depsContainer) return;

            // Check if any package items are visible
            const visibleItems = depsContainer.querySelectorAll('.package-item:not([style*="display: none"])');
            totalVisibleItems += visibleItems.length;

            // Hide the entire file group if no visible items
            if (visibleItems.length === 0 && (filterState.searchQuery || currentFilter !== 'all')) {
                group.style.display = 'none';
            } else {
                group.style.display = '';
            }
        });

        // Show/hide "no results" message
        showNoResultsMessage(totalVisibleItems === 0 && (filterState.searchQuery || currentFilter !== 'all'));
    }

    function showNoResultsMessage(show) {
        let noResultsEl = document.getElementById('no-search-results');

        if (show) {
            if (!noResultsEl) {
                const content = document.getElementById('content');
                const dependencyFiles = content.querySelector('.dependency-files');

                if (dependencyFiles) {
                    noResultsEl = document.createElement('div');
                    noResultsEl.id = 'no-search-results';
                    noResultsEl.className = 'empty-state';
                    noResultsEl.style.marginTop = '20px';
                    dependencyFiles.appendChild(noResultsEl);
                }
            }

            if (noResultsEl) {
                const message = filterState.searchQuery
                    ? \`No packages match your search "\${filterState.searchQuery}"\`
                    : 'No packages match the current filter';

                noResultsEl.innerHTML = \`
                    <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <div>\${message}</div>
                    <div style="font-size: 12px; margin-top: 8px; color: var(--vscode-descriptionForeground);">
                        Try adjusting your search or filter criteria
                    </div>
                \`;
                noResultsEl.style.display = 'block';
            }
        } else {
            if (noResultsEl) {
                noResultsEl.style.display = 'none';
            }
        }
    }

    function clearSearch() {
        const searchInput = document.getElementById('package-search-input');
        if (searchInput) {
            searchInput.value = '';
        }
        filterState.searchQuery = '';

        // Save state
        if (typeof saveWebviewState === 'function') {
            saveWebviewState();
        }

        // Update display
        updateSearchResultsDisplay();
        applySearchFilter();
    }

    // Keyboard shortcut support for search
    function initSearchKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+F or Cmd+F to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                const searchInput = document.getElementById('package-search-input');
                if (searchInput) {
                    e.preventDefault();
                    searchInput.focus();
                    searchInput.select();
                }
            }

            // Escape to clear search when focused on search input
            if (e.key === 'Escape') {
                const searchInput = document.getElementById('package-search-input');
                if (searchInput && document.activeElement === searchInput) {
                    e.preventDefault();
                    clearSearch();
                    searchInput.blur();
                }
            }
        });
    }

    // Initialize keyboard shortcuts on DOMContentLoaded
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initSearchKeyboardShortcuts);
        } else {
            initSearchKeyboardShortcuts();
        }
    }

    function matchesSearchQuery(dependency) {
        if (!filterState.searchQuery) return true;

        const query = filterState.searchQuery;
        const name = dependency.name.toLowerCase();
        const version = dependency.version ? dependency.version.toLowerCase() : '';

        // Check if package name or version matches
        if (name.includes(query) || version.includes(query)) {
            return true;
        }

        // Check metadata fields
        if (dependency.metadata) {
            const author = dependency.metadata.author ? dependency.metadata.author.toLowerCase() : '';
            const license = dependency.metadata.license ? dependency.metadata.license.toLowerCase() : '';

            if (author.includes(query) || license.includes(query)) {
                return true;
            }
        }

        // Check vulnerability IDs
        if (dependency.vulnerabilities && dependency.vulnerabilities.length > 0) {
            for (const vuln of dependency.vulnerabilities) {
                if (vuln.id.toLowerCase().includes(query)) {
                    return true;
                }
                if (vuln.cveIds && vuln.cveIds.some(cve => cve.toLowerCase().includes(query))) {
                    return true;
                }
            }
        }

        return false;
    }

    function getSearchMatchCount() {
        if (!lastData || !filterState.searchQuery) return 0;

        let count = 0;
        if (lastCommand === 'scanEcosystem' || lastCommand === 'scanAllEcosystems') {
            lastData.files.forEach(fileData => {
                count += fileData.dependencies.filter(dep => matchesSearchQuery(dep)).length;
            });
        }
        return count;
    }

    function highlightSearchTerm(text, wrapInSpan = true) {
        if (!filterState.searchQuery || !text) return text;

        const query = filterState.searchQuery;
        // Simple case-insensitive search and replace
        const lowerText = text.toLowerCase();
        const index = lowerText.indexOf(query);

        if (index === -1) return text;

        if (!wrapInSpan) return text;

        // Highlight all occurrences
        let result = text;
        let searchPos = 0;
        const parts = [];

        while (searchPos < result.length) {
            const lowerPart = result.toLowerCase();
            const foundIndex = lowerPart.indexOf(query, searchPos);

            if (foundIndex === -1) {
                parts.push(result.substring(searchPos));
                break;
            }

            parts.push(result.substring(searchPos, foundIndex));
            parts.push('<mark class="search-highlight">');
            parts.push(result.substring(foundIndex, foundIndex + query.length));
            parts.push('</mark>');
            searchPos = foundIndex + query.length;
        }

        return parts.join('');
    }

    // Enhanced filter rendering helper
    function renderFilterBar(summary, hasVulnerabilities, hasOutdated, hasUnknownLicense) {
        const filterButtons = [
            {
                filter: 'all',
                label: 'All',
                condition: true,
                count: summary.totalDependencies
            },
            {
                filter: 'vulnerable',
                label: 'Vulnerable Only',
                condition: hasVulnerabilities,
                count: summary.vulnerablePackages
            },
            {
                filter: 'outdated',
                label: 'Outdated Only',
                condition: hasOutdated,
                count: summary.outdatedPackages
            },
            {
                filter: 'unknown-license',
                label: 'Unknown License',
                condition: hasUnknownLicense,
                count: summary.unknownLicensePackages
            }
        ];

        // Add severity filters
        if (summary.vulnerabilityBreakdown) {
            ['critical', 'high', 'medium', 'low'].forEach(severity => {
                const count = summary.vulnerabilityBreakdown[severity] || 0;
                if (count > 0) {
                    filterButtons.push({
                        filter: severity,
                        label: \`\${severity.charAt(0).toUpperCase() + severity.slice(1)} (\${count})\`,
                        condition: true,
                        count: count
                    });
                }
            });
        }

        let filterBarHtml = \`
            <div class="filter-bar">
                <div class="filter-section">
                    <span style="font-size: 11px; font-weight: 500;">Filter:</span>
                    <div class="filter-buttons">\`;

        filterButtons.forEach(button => {
            if (button.condition) {
                const isActive = currentFilter === button.filter;
                filterBarHtml += \`
                    <button class="filter-button \${isActive ? 'active' : ''}"
                            data-filter="\${button.filter}"
                            onclick="setFilter('\${button.filter}')"
                            title="Show \${button.count} items">
                        \${button.label}
                    </button>\`;
            }
        });

        // Add clear/reset button if not on 'all'
        if (currentFilter !== 'all') {
            filterBarHtml += \`
                <button class="filter-button filter-clear"
                        onclick="clearFilters()"
                        title="Clear all filters">
                    ✕ Clear
                </button>\`;
        }

        filterBarHtml += \`
                    </div>
                </div>
                <div class="search-section">
                    <div class="search-container">
                        <span class="search-icon">🔍</span>
                        <input type="text"
                               id="package-search-input"
                               class="search-input"
                               placeholder="Search packages... (Ctrl/Cmd+F)"
                               value="\${filterState.searchQuery}"
                               oninput="setSearchQuery(this.value)"
                               title="Search by package name, version, author, license, or CVE ID. Press Ctrl/Cmd+F to focus, Esc to clear." />
                        \${filterState.searchQuery ? \`
                        <button class="search-clear-btn" onclick="clearSearch()" title="Clear search">✕</button>
                        \` : ''}
                    </div>
                    \${filterState.searchQuery ? \`
                        <div class="search-results-count">
                            Found \${getSearchMatchCount()} matching package\${getSearchMatchCount() !== 1 ? 's' : ''}
                        </div>
                    \` : ''}
                </div>
            </div>\`;

        return filterBarHtml;
    }
  `;
};

export const getFilterUtilityStyles = (): string => {
  return `
    .filter-clear {
        background-color: var(--vscode-errorBackground) !important;
        color: var(--vscode-errorForeground) !important;
        border-color: var(--vscode-errorBorder) !important;
        margin-left: 4px;
    }

    .filter-clear:hover {
        background-color: var(--vscode-errorHoverBackground) !important;
        transform: translateY(-1px);
    }

    .filter-suggestion {
        background-color: var(--vscode-infoBackground);
        color: var(--vscode-infoForeground);
        border: 1px solid var(--vscode-infoBorder);
        padding: 8px 12px;
        border-radius: 4px;
        margin-bottom: 8px;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .filter-suggestion-icon {
        flex-shrink: 0;
    }

    .filter-suggestion-action {
        margin-left: auto;
        padding: 2px 6px;
        background-color: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 3px;
        cursor: pointer;
        font-size: 10px;
    }

    .filter-suggestion-action:hover {
        background-color: var(--vscode-button-secondaryHoverBackground);
    }

    .filter-bar-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 4px;
    }

    .filter-count-badge {
        background-color: var(--vscode-badge-background);
        color: var(--vscode-badge-foreground);
        padding: 1px 4px;
        border-radius: 2px;
        font-size: 9px;
        margin-left: 4px;
        font-weight: 600;
    }

    /* Search functionality styles */
    .filter-section {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        min-width: 0;
    }

    .filter-buttons {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
    }

    .search-section {
        flex-shrink: 0;
        min-width: 200px;
        max-width: 400px;
    }

    .search-container {
        position: relative;
        display: flex;
        align-items: center;
        gap: 4px;
        background-color: var(--vscode-input-background);
        border: 1px solid var(--vscode-input-border);
        border-radius: 4px;
        padding: 4px 8px;
        transition: border-color 0.2s;
    }

    .search-container:focus-within {
        border-color: var(--vscode-focusBorder);
        box-shadow: 0 0 0 1px var(--vscode-focusBorder);
    }

    .search-icon {
        font-size: 12px;
        opacity: 0.7;
        flex-shrink: 0;
    }

    .search-input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        color: var(--vscode-input-foreground);
        font-size: 12px;
        font-family: var(--vscode-font-family);
        padding: 2px 4px;
        min-width: 100px;
    }

    .search-input::placeholder {
        color: var(--vscode-input-placeholderForeground);
        opacity: 0.6;
    }

    .search-clear-btn {
        background: transparent;
        border: none;
        color: var(--vscode-input-foreground);
        cursor: pointer;
        padding: 0 4px;
        font-size: 12px;
        opacity: 0.6;
        transition: opacity 0.2s;
        flex-shrink: 0;
    }

    .search-clear-btn:hover {
        opacity: 1;
        color: var(--vscode-errorForeground);
    }

    .search-results-count {
        font-size: 10px;
        color: var(--vscode-descriptionForeground);
        margin-top: 4px;
        padding-left: 24px;
        font-style: italic;
    }

    .search-highlight {
        background-color: var(--vscode-editor-findMatchHighlightBackground);
        color: var(--vscode-editor-foreground);
        border-radius: 2px;
        padding: 0 2px;
        font-weight: 600;
    }

    @media (max-width: 600px) {
        .filter-section {
            width: 100%;
        }

        .search-section {
            width: 100%;
            max-width: 100%;
            margin-top: 8px;
        }
    }
  `;
};
