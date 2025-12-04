
import * as vscode from "vscode";
import * as path from 'path'; // Need path for joinPath
import * as fs from 'fs';   // Need fs to read the built index.html

export function activate(context: vscode.ExtensionContext) {
  // 1. Register the command that will launch the webview
  const disposable = vscode.commands.registerCommand("arkhe.helloWorld", () => {
    // 2. Create and show a new webview panel
    const panel = vscode.window.createWebviewPanel(
      "reactWebview", // Internal ID for the webview
      "React VS Code Extension", // Title of the panel displayed to the user
      vscode.ViewColumn.One, // Editor column to show the new webview panel in
      {
        // Enable scripts in the webview (Required for React)
        enableScripts: true,
        // Allow access to the entire extension directory root to cover all built assets
        localResourceRoots: [
          vscode.Uri.joinPath(context.extensionUri, "out"),
          vscode.Uri.joinPath(context.extensionUri, "webview-ui", "build"),
          context.extensionUri,
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
          case "showWarning":
            console.log("message.text: ", message.text);
            vscode.window.showWarningMessage(
              message.text + "Other information from server"
            );

            panel.webview.postMessage({
              command: "replyFromExtension",
              payload: {
                status: "success",
                serverTimestamp: new Date().toLocaleTimeString(),
                extraInfo: "This data came from Node.js!",
              },
            });

            return;

          case "saveFile":
            return;
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
  
  // 1. Define the absolute path to the final built index.html
  const buildFolderUri = vscode.Uri.joinPath(extensionUri, "webview-ui", "build");
  const htmlPath = vscode.Uri.joinPath(buildFolderUri, "index.html");

  // 2. Read the built HTML file content from disk
  // NOTE: This requires @types/node and synchronous reading is safe in activation context
  let htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf8');

  // 3. Generate the nonce for security
  const nonce = getNonce();

  // 4. Generate SECURE URI FOR BASE ASSETS (e.g., /webview-ui/build/)
  const buildUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'webview-ui', 'build')
  );

  // 5. Inject the secure URI, CSP, and nonce into the HTML content
  htmlContent = htmlContent
    // Remove the insecure Mermaid CDN link if present (CRUCIAL)
    .replace('<script src="https://cdn.jsdelivr.net/npm/mermaid@10.8.0/dist/mermaid.min.js"></script>', '')

    // Convert asset paths (./assets/*) to VS Code resource URIs so they pass CSP
    .replace(/(src|href)="(\.\/assets\/[^"]+)"/g, (_, attr, originalPath) => {
      const assetUri = webview.asWebviewUri(
        vscode.Uri.joinPath(
          buildFolderUri,
          ...originalPath.replace(/^\.\//, '').split('/')
        )
      );
      return `${attr}="${assetUri.toString()}"`;
    })

    // Inject the CSP meta tag and set the <base> tag (for relative paths in the built HTML)
    .replace('</head>', `
      <base href="${buildUri.toString()}/">
      <meta http-equiv="Content-Security-Policy" content="
          default-src 'none';
          style-src ${webview.cspSource} 'unsafe-inline' vscode-resource:;
          img-src ${webview.cspSource} https: data:;
          script-src 'nonce-${nonce}' vscode-resource:;
          connect-src ${webview.cspSource};
      ">
      </head>
    `)
    // Inject the nonce into the main script tag (assumes Vite generated a single script tag)
    // You might need to adjust the regex depending on your Vite output's script tag format.
    .replace('<script', `<script nonce="${nonce}"`);


  return htmlContent;
}

// Helper to generate a random nonce for CSP security
function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export function deactivate() {}
