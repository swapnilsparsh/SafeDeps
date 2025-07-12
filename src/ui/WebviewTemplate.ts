import {
  getWebviewStyles,
  getWebviewHeader,
  getWebviewButtons,
  getWebviewContent,
  getWebviewJavaScript
} from '../webview';

export const generateWebviewHtml = (): string => {
  return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>SafeDeps</title>
            <style>
                ${getWebviewStyles()}
            </style>
        </head>
        <body>
            ${getWebviewHeader()}
            ${getWebviewButtons()}
            ${getWebviewContent()}
            ${getWebviewScript()}
        </body>
        </html>`;
};

const getWebviewScript = (): string => {
  return `
        <script>
            ${getWebviewJavaScript()}
        </script>
    `;
};
