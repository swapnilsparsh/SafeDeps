export const getEcosystemDropdownButton = (): string => {
  return `
    <div class="ecosystem-dropdown">
      <button class="ecosystem-btn" id="ecosystemBtn" onclick="handleEcosystemButtonClick()">
        <span class="ecosystem-btn-icon" id="ecosystemBtnIcon">🎯</span>
        <span class="ecosystem-btn-text" id="ecosystemBtnText">Select Ecosystem</span>
        <span class="ecosystem-btn-arrow" id="ecosystemBtnArrow">▼</span>
      </button>
      <div class="ecosystem-menu" id="ecosystemMenu">
        <div class="ecosystem-menu-header">Available Ecosystems</div>
        <div class="ecosystem-menu-items" id="ecosystemMenuItems">
          <div class="ecosystem-loading">Scanning for ecosystems...</div>
        </div>
      </div>
    </div>
  `;
};

export const getEcosystemDropdownButtonStyles = (): string => {
  return `
    .ecosystem-dropdown {
      position: relative;
      margin-bottom: 8px;
    }

    .ecosystem-btn {
      width: 100%;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: 1px solid var(--vscode-button-border, rgba(255,255,255,0.1));
      border-radius: 4px;
      padding: 8px 12px;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.2s ease;
      min-height: 28px;
    }

    .ecosystem-btn:hover {
      background: var(--vscode-button-hoverBackground);
      border-color: var(--vscode-focusBorder, rgba(255,255,255,0.2));
    }

    .ecosystem-btn.open {
      border-color: var(--vscode-focusBorder);
      background: var(--vscode-button-hoverBackground);
    }

    .ecosystem-btn-icon {
      font-size: 12px;
      opacity: 0.8;
    }

    .ecosystem-btn-text {
      font-weight: 400;
    }

    .ecosystem-btn-arrow {
      font-size: 10px;
      opacity: 0.6;
      transition: transform 0.2s ease;
    }

    .ecosystem-btn-arrow.hidden {
      display: none;
    }

    .ecosystem-btn.open .ecosystem-btn-arrow {
      transform: rotate(180deg);
    }

    .ecosystem-menu {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: var(--vscode-dropdown-background);
      border: 1px solid var(--vscode-dropdown-border);
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      margin-top: 4px;
      display: none;
      overflow: hidden;
    }

    .ecosystem-menu.show {
      display: block;
      animation: slideDown 0.15s ease-out;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .ecosystem-menu-header {
      background: var(--vscode-editorWidget-background);
      color: var(--vscode-editorWidget-foreground);
      padding: 8px 12px;
      font-size: 11px;
      font-weight: 600;
      border-bottom: 1px solid var(--vscode-panel-border);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.8;
    }

    .ecosystem-menu-items {
      max-height: 200px;
      overflow-y: auto;
    }

    .ecosystem-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      cursor: pointer;
      transition: background-color 0.15s ease;
      border-bottom: 1px solid var(--vscode-panel-border);
    }

    .ecosystem-item:last-child {
      border-bottom: none;
    }

    .ecosystem-item:hover {
      background: var(--vscode-list-hoverBackground);
    }

    .ecosystem-item-icon {
      font-size: 16px;
      width: 20px;
      text-align: center;
      flex-shrink: 0;
    }

    .ecosystem-item-content {
      flex: 1;
    }

    .ecosystem-item-name {
      font-weight: 500;
      font-size: 12px;
      color: var(--vscode-foreground);
      margin-bottom: 2px;
    }

    .ecosystem-item-desc {
      font-size: 10px;
      color: var(--vscode-descriptionForeground);
      opacity: 0.8;
    }

    .ecosystem-item-count {
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 8px;
      font-weight: 500;
    }

    .ecosystem-loading {
      padding: 16px 12px;
      text-align: center;
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      opacity: 0.7;
    }

    .ecosystem-empty {
      padding: 16px 12px;
      text-align: center;
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
    }

    .ecosystem-empty-icon {
      font-size: 24px;
      margin-bottom: 8px;
      opacity: 0.5;
    }

    /* Overlay for clicking outside */
    .ecosystem-overlay {
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
    let availableEcosystems = [];
    let ecosystemFiles = {};
    let isDropdownOpen = false;

    const ecosystemConfig = {
      'JavaScript/TypeScript': {
        icon: '📦',
        name: 'npm',
        desc: 'Node.js packages',
        files: ['package.json'],
        ecosystem: 'npm'
      },
      'Python': {
        icon: '🐍',
        name: 'PyPI',
        desc: 'Python packages',
        files: ['requirements.txt', 'setup.py', 'pyproject.toml'],
        ecosystem: 'PyPI'
      },
      'Java': {
        icon: '☕',
        name: 'Maven',
        desc: 'Java/Kotlin projects',
        files: ['pom.xml', 'build.gradle'],
        ecosystem: 'Maven'
      },
      'Go': {
        icon: '🐹',
        name: 'Go',
        desc: 'Go modules',
        files: ['go.mod'],
        ecosystem: 'Go'
      },
      'Rust': {
        icon: '🦀',
        name: 'Crates.io',
        desc: 'Rust packages',
        files: ['Cargo.toml'],
        ecosystem: 'crates.io'
      },
      'Ruby': {
        icon: '💎',
        name: 'RubyGems',
        desc: 'Ruby gems',
        files: ['Gemfile'],
        ecosystem: 'RubyGems'
      },
      'PHP': {
        icon: '🐘',
        name: 'Packagist',
        desc: 'PHP packages',
        files: ['composer.json'],
        ecosystem: 'Packagist'
      }
    };

    function updateAvailableEcosystems(ecosystems, filesByEcosystem = {}) {
      console.log('Updating ecosystems:', ecosystems, filesByEcosystem);
      availableEcosystems = ecosystems || [];
      ecosystemFiles = filesByEcosystem || {};
      populateEcosystemMenu();
      updateButtonForSingleEcosystem();
    }

    function updateButtonForSingleEcosystem() {
      const btn = document.getElementById('ecosystemBtn');
      const btnIcon = document.getElementById('ecosystemBtnIcon');
      const btnText = document.getElementById('ecosystemBtnText');
      const btnArrow = document.getElementById('ecosystemBtnArrow');
      const allEcosystemsBtn = document.getElementById('allEcosystemsBtn');

      if (!btn || !btnIcon || !btnText || !btnArrow) return;

      if (availableEcosystems.length === 1) {
        // Single ecosystem detected - update button to show direct action
        const detectedLanguage = availableEcosystems[0];
        const config = ecosystemConfig[detectedLanguage] || {
          icon: '📄',
          name: detectedLanguage,
          desc: 'Package ecosystem',
          files: [],
          ecosystem: detectedLanguage
        };

        btnIcon.textContent = config.icon;
        btnText.textContent = \`Analyze \${config.name}\`;
        btnArrow.classList.add('hidden');
        btn.dataset.singleEcosystem = config.ecosystem;

        // Hide "All Ecosystems" button when only one ecosystem is detected
        if (allEcosystemsBtn) {
          allEcosystemsBtn.style.display = 'none';
        }
      } else {
        // Multiple or no ecosystems - show default dropdown
        btnIcon.textContent = '🎯';
        btnText.textContent = 'Select Ecosystem';
        btnArrow.classList.remove('hidden');
        delete btn.dataset.singleEcosystem;

        // Show "All Ecosystems" button when multiple ecosystems are detected
        if (allEcosystemsBtn) {
          allEcosystemsBtn.style.display = '';
        }
      }
    }

    function handleEcosystemButtonClick() {
      const btn = document.getElementById('ecosystemBtn');

      // If single ecosystem, directly trigger scan
      if (btn && btn.dataset.singleEcosystem) {
        selectEcosystem(btn.dataset.singleEcosystem);
      } else {
        // Otherwise, toggle dropdown
        toggleEcosystemDropdown();
      }
    }

    function populateEcosystemMenu() {
      const menuItems = document.getElementById('ecosystemMenuItems');
      if (!menuItems) return;

      if (availableEcosystems.length === 0) {
        menuItems.innerHTML = \`
          <div class="ecosystem-empty">
            <div class="ecosystem-empty-icon">📂</div>
            <div>No dependency files detected</div>
            <div style="margin-top: 4px; opacity: 0.6;">Run a workspace scan first</div>
          </div>
        \`;
        return;
      }

      let html = '';
      availableEcosystems.forEach(detectedLanguage => {
        const config = ecosystemConfig[detectedLanguage] || {
          icon: '📄',
          name: detectedLanguage,
          desc: 'Package ecosystem',
          files: [],
          ecosystem: detectedLanguage
        };

        const fileCount = ecosystemFiles[detectedLanguage] || 0;

        html += \`
          <div class="ecosystem-item" onclick="selectEcosystem('\${config.ecosystem}')">
            <div class="ecosystem-item-icon">\${config.icon}</div>
            <div class="ecosystem-item-content">
              <div class="ecosystem-item-name">\${config.name}</div>
              <div class="ecosystem-item-desc">\${config.desc}</div>
            </div>
            \${fileCount > 0 ? \`<div class="ecosystem-item-count">\${fileCount} file\${fileCount !== 1 ? 's' : ''}</div>\` : ''}
          </div>
        \`;
      });

      menuItems.innerHTML = html;
    }

    function toggleEcosystemDropdown() {
      const btn = document.getElementById('ecosystemBtn');
      const menu = document.getElementById('ecosystemMenu');

      if (isDropdownOpen) {
        closeEcosystemDropdown();
      } else {
        openEcosystemDropdown();
      }
    }

    function openEcosystemDropdown() {
      const btn = document.getElementById('ecosystemBtn');
      const menu = document.getElementById('ecosystemMenu');

      btn.classList.add('open');
      menu.classList.add('show');
      isDropdownOpen = true;

      // Add overlay to close on outside click
      const overlay = document.createElement('div');
      overlay.className = 'ecosystem-overlay';
      overlay.onclick = closeEcosystemDropdown;
      document.body.appendChild(overlay);
    }

    function closeEcosystemDropdown() {
      const btn = document.getElementById('ecosystemBtn');
      const menu = document.getElementById('ecosystemMenu');
      const overlay = document.querySelector('.ecosystem-overlay');

      btn.classList.remove('open');
      menu.classList.remove('show');
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
