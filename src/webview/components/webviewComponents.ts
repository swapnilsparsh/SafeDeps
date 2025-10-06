import { getEcosystemDropdownButton } from "./EcosystemDropdown";

export const getWebviewHeader = (): string => {
  return `
        <div class="header">
            <div class="header-title">SafeDeps</div>
        </div>
    `;
};

export const getWebviewButtons = (): string => {
  return `
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
