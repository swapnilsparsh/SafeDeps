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
        counts: {}
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
                <span style="font-size: 11px; font-weight: 500;">Filter:</span>\`;

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

        filterBarHtml += \`</div>\`;

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
  `;
};
