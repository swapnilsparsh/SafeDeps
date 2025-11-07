import { getEcosystemDropdownButton } from "./EcosystemDropdown";

export const getWebviewHeader = (): string => {
  return `
        <div class="header">
            <div class="header-title">SafeDeps</div>
            <button class="settings-button" onclick="toggleSettings()" title="Settings">
                ⚙️
            </button>
        </div>
    `;
};

export const getWebviewButtons = (): string => {
  return `
        <div id="settings-panel" class="settings-panel" style="display: none;">
            <div class="settings-content">
                <h3 style="margin-top: 0; font-size: 14px;">Settings</h3>
                <div class="setting-item">
                    <label class="toggle-label">
                        <input type="checkbox" id="respectGitignoreToggle" onchange="handleGitignoreToggle(this.checked)" />
                        <span class="toggle-slider"></span>
                        <span class="toggle-text">Respect .gitignore files</span>
                    </label>
                    <p class="setting-description">
                        When enabled, directories and files listed in .gitignore will be excluded from scans.
                        This improves performance by skipping build artifacts, node_modules, etc.
                    </p>
                </div>
            </div>
        </div>
        <button class="scan-button" onclick="scanDependencies()">
            🔍 Scan Workspace
        </button>
        ${getEcosystemDropdownButton()}
        <button class="scan-button" id="allEcosystemsBtn" onclick="scanAllEcosystems()">
            🌐 All Ecosystems
        </button>
    `;
};

export const getWebviewContent = (): string => {
  return `
        <div id="content">
            <div class="loading">
                <div>Scanning workspace for dependency files...</div>
            </div>
        </div>
    `;
};
