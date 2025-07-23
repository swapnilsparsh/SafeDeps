export const getWebviewHeader = (): string => {
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

export const getWebviewButtons = (): string => {
  return `
        <button class="scan-button" onclick="scanDependencies()">
            🔍 Scan Dependencies
        </button>
        <button class="scan-button" onclick="scanPackageJson()">
            📦 Analyze Dependencies
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
