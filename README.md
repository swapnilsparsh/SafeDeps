# SafeDeps VS Code Extension

A VS Code extension for dependency safety checks that adds a custom icon to the Activity Bar and provides a dedicated sidebar view.

## Features

- **Custom Activity Bar Icon**: Adds a SafeDeps icon to the VS Code Activity Bar for easy access
- **Dedicated Sidebar View**: Opens a WebviewView titled "SafeDeps" when the Activity Bar icon is clicked
- **Modern UI**: Uses VS Code's native theming and provides a clean, professional interface

## Getting Started

### Prerequisites

- VS Code version 1.101.0 or higher
- Node.js and npm

### Installation

1. Clone this repository
2. Run `npm install` to install dependencies
3. Open the project in VS Code
4. Press `F5` to run the extension in a new Extension Development Host window

### Development

- Run `npm run compile` to build the extension
- Run `npm run watch` to start the development server with auto-rebuild
- Press `F5` in VS Code to launch a new Extension Development Host window

## Extension Structure

- `src/extension.ts` - Main extension entry point
- `src/SafeDepsWebviewViewProvider.ts` - WebviewView provider for the sidebar
- `media/icon.svg` - Custom icon for the Activity Bar
- `package.json` - Extension manifest with contributions

## How it Works

The extension contributes:

1. **View Container**: Adds a new container to the Activity Bar with a custom icon
2. **WebviewView**: Registers a webview view that displays in the sidebar
3. **Provider**: Implements a WebviewViewProvider to handle the view content

The sidebar currently displays a welcome message and is ready to be extended with dependency analysis features.

## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

- `myExtension.enable`: Enable/disable this extension.
- `myExtension.thing`: Set to `blah` to do something.

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

- Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
- Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
- Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

- [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
- [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
