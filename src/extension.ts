import * as vscode from 'vscode';

// import { ChatOpenAI } from '@langchain/openai';
// import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
// import { z } from 'zod';

export function activate(context: vscode.ExtensionContext) {
  // 1. Register the command that will launch the webview
  // Make sure "arkhe.helloWorld" matches the command ID in your package.json
  const disposable = vscode.commands.registerCommand('arkhe.helloWorld', () => {
    // 2. Create and show a new webview panel
    const panel = vscode.window.createWebviewPanel(
      'reactWebview', // Internal ID for the webview
      'React VS Code Extension', // Title of the panel displayed to the user
      vscode.ViewColumn.One, // Editor column to show the new webview panel in
      {
        // Enable scripts in the webview (Required for React)
        enableScripts: true,
        // Restrict the webview to only load resources from the `out` and `webview-ui/build` directories
        localResourceRoots: [
          vscode.Uri.joinPath(context.extensionUri, 'out'),
          vscode.Uri.joinPath(context.extensionUri, 'webview-ui', 'build'),
        ],
      }
    );

    // 3. Set the HTML content for the webview
    panel.webview.html = getWebviewContent(panel.webview, context.extensionUri);

    // This function listens to ALL messages from the frontend
    panel.webview.onDidReceiveMessage(
      (message) => {
        // "Router" logic
        switch (message.command) {
          case 'showWarning':
            // Execute Node.js logic
            console.log('message.text: ', message.text);
            vscode.window.showWarningMessage(
              message.text + 'Other information from server'
            );

            panel.webview.postMessage({
              command: 'replyFromExtension', // Custom command ID
              payload: {
                status: 'success',
                serverTimestamp: new Date().toLocaleTimeString(),
                extraInfo: 'This data came from Node.js!',
              },
            });

            return;

          case 'saveFile':
            // Handle saving logic...
            return;

          // ... add more "routes" here
        }
      },
      undefined,
      context.subscriptions
    );
  });

  context.subscriptions.push(disposable);
}

// This helper function generates the HTML structure that hosts the React app
function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
  const rootUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'webview-ui', 'build')
  );

  // The CSS file from the React build output
  const stylesUri = webview.asWebviewUri(
    vscode.Uri.joinPath(
      extensionUri,
      'webview-ui',
      'build',
      'assets',
      'index.css'
    )
  );

  // The JS file from the React build output
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(
      extensionUri,
      'webview-ui',
      'build',
      'assets',
      'index.js'
    )
  );

  // Use a nonce to only allow specific scripts to run (Security Best Practice)
  const nonce = getNonce();

  // Tip: The "webview-ui/build" path must match your Vite build output directory.
  // The "index.js" and "index.css" filenames must match the "rollupOptions" in vite.config.ts.

  return /*html*/ `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        
        <base href="${rootUri}/">

        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https: data:; script-src 'nonce-${nonce}';">
        
        <link rel="stylesheet" type="text/css" href="${stylesUri}" />
        <title>React VS Code Extension</title>
      </head>
      <body>
        <div id="root"></div>
        <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
      </body>
    </html>
  `;
}

// Helper to generate a random nonce for CSP security
function getNonce() {
  let text = '';
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// This method is called when your extension is deactivated
export function deactivate() {}
