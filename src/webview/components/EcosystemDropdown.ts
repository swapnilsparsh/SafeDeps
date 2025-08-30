export const getEcosystemDropdownButton = (): string => {
  return `
    <div class="dropdown-button-container">
      <div class="dropdown-wrapper">
        <button class="ecosystem-dropdown-button" id="ecosystemDropdownBtn" onclick="toggleEcosystemDropdown()">
          <span class="btn-icon">🔍</span>
          <span class="btn-text">Analyze Single Ecosystem</span>
          <span class="dropdown-arrow">▼</span>
        </button>
        <div class="ecosystem-options" id="ecosystemOptions" style="display: none;">
          <div class="ecosystem-option" data-ecosystem="npm" onclick="selectEcosystem('npm')">
            <span class="ecosystem-icon">📦</span>
            <div class="ecosystem-details">
              <div class="ecosystem-name">npm</div>
              <div class="ecosystem-desc">JavaScript/TypeScript (package.json)</div>
            </div>
          </div>
          <div class="ecosystem-option" data-ecosystem="PyPI" onclick="selectEcosystem('PyPI')">
            <span class="ecosystem-icon">🐍</span>
            <div class="ecosystem-details">
              <div class="ecosystem-name">PyPI</div>
              <div class="ecosystem-desc">Python (requirements.txt)</div>
            </div>
          </div>
          <div class="ecosystem-option" data-ecosystem="Maven" onclick="selectEcosystem('Maven')">
            <span class="ecosystem-icon">☕</span>
            <div class="ecosystem-details">
              <div class="ecosystem-name">Maven</div>
              <div class="ecosystem-desc">Java (pom.xml, build.gradle)</div>
            </div>
          </div>
          <div class="ecosystem-option" data-ecosystem="Go" onclick="selectEcosystem('Go')">
            <span class="ecosystem-icon">🔵</span>
            <div class="ecosystem-details">
              <div class="ecosystem-name">Go</div>
              <div class="ecosystem-desc">Go modules (go.mod)</div>
            </div>
          </div>
          <div class="ecosystem-option" data-ecosystem="crates.io" onclick="selectEcosystem('crates.io')">
            <span class="ecosystem-icon">🦀</span>
            <div class="ecosystem-details">
              <div class="ecosystem-name">Crates.io</div>
              <div class="ecosystem-desc">Rust (Cargo.toml)</div>
            </div>
          </div>
          <div class="ecosystem-option" data-ecosystem="RubyGems" onclick="selectEcosystem('RubyGems')">
            <span class="ecosystem-icon">💎</span>
            <div class="ecosystem-details">
              <div class="ecosystem-name">RubyGems</div>
              <div class="ecosystem-desc">Ruby (Gemfile)</div>
            </div>
          </div>
          <div class="ecosystem-option" data-ecosystem="Packagist" onclick="selectEcosystem('Packagist')">
            <span class="ecosystem-icon">�</span>
            <div class="ecosystem-details">
              <div class="ecosystem-name">Packagist</div>
              <div class="ecosystem-desc">PHP (composer.json)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

export const getEcosystemDropdownButtonStyles = (): string => {
  return `
    .dropdown-button-container {
      position: relative;
      margin-bottom: 12px;
    }

    .ecosystem-dropdown-button {
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      padding: 12px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      width: 100%;
      position: relative;
    }

    .ecosystem-dropdown-button:hover {
      background-color: var(--vscode-button-hoverBackground);
      transform: translateY(-1px);
    }

    .ecosystem-dropdown-button .btn-icon {
      font-size: 14px;
    }

    .ecosystem-dropdown-button .btn-text {
      flex: 1;
      text-align: left;
    }

    .ecosystem-dropdown-button .dropdown-arrow {
      font-size: 10px;
      transition: transform 0.2s ease;
    }

    .ecosystem-dropdown-button.open .dropdown-arrow {
      transform: rotate(180deg);
    }

    .ecosystem-options {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: var(--vscode-dropdown-background);
      border: 1px solid var(--vscode-dropdown-border);
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      margin-top: 4px;
      max-height: 300px;
      overflow-y: auto;
    }

    .ecosystem-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      cursor: pointer;
      transition: background-color 0.2s ease;
      border-bottom: 1px solid var(--vscode-panel-border);
    }

    .ecosystem-option:last-child {
      border-bottom: none;
    }

    .ecosystem-option:hover {
      background-color: var(--vscode-list-hoverBackground);
    }

    .ecosystem-icon {
      font-size: 16px;
      width: 20px;
      text-align: center;
    }

    .ecosystem-details {
      flex: 1;
    }

    .ecosystem-name {
      font-weight: 500;
      color: var(--vscode-foreground);
      font-size: 13px;
    }

    .ecosystem-desc {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      margin-top: 2px;
    }

    /* Close dropdown when clicking outside */
    .dropdown-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 999;
      background: transparent;
    }
  `;
};

export const getEcosystemDropdownButtonScript = (): string => {
  return `
    let isDropdownOpen = false;

    function toggleEcosystemDropdown() {
      const dropdown = document.getElementById('ecosystemOptions');
      const button = document.getElementById('ecosystemDropdownBtn');

      if (isDropdownOpen) {
        closeEcosystemDropdown();
      } else {
        openEcosystemDropdown();
      }
    }

    function openEcosystemDropdown() {
      const dropdown = document.getElementById('ecosystemOptions');
      const button = document.getElementById('ecosystemDropdownBtn');

      dropdown.style.display = 'block';
      button.classList.add('open');
      isDropdownOpen = true;

      // Add overlay to close on outside click
      const overlay = document.createElement('div');
      overlay.className = 'dropdown-overlay';
      overlay.onclick = closeEcosystemDropdown;
      document.body.appendChild(overlay);
    }

    function closeEcosystemDropdown() {
      const dropdown = document.getElementById('ecosystemOptions');
      const button = document.getElementById('ecosystemDropdownBtn');
      const overlay = document.querySelector('.dropdown-overlay');

      dropdown.style.display = 'none';
      button.classList.remove('open');
      isDropdownOpen = false;

      if (overlay) {
        overlay.remove();
      }
    }

    function selectEcosystem(ecosystem) {
      if (isLoading) return;

      closeEcosystemDropdown();

      setLoadingState(true);
      lastCommand = 'scanEcosystem';
      document.getElementById('content').innerHTML = \`
        <div class="loading">
          <div class="loading-spinner"></div>
          <div>Analyzing \${ecosystem} dependencies and checking for vulnerabilities...</div>
        </div>
      \`;

      vscode.postMessage({
        command: 'scanEcosystem',
        ecosystem: ecosystem
      });
    }

    // Close dropdown when pressing Escape
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape' && isDropdownOpen) {
        closeEcosystemDropdown();
      }
    });
  `;
};
