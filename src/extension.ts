// import * as dotenv from 'dotenv';
import * as vscode from "vscode";
import * as path from "path"; // Need path for joinPath
import * as fs from "fs"; // Need fs to read the built index.html
import { MessageToBackend } from "./types";
import { CommandHandler } from "./handlers/CommandHandler";
import { ConfigManager } from "./managers/ConfigManager";
import { StartupTracker } from "./utils/PerformanceLogger";

export function activate(context: vscode.ExtensionContext) {
  ConfigManager.getInstance().initialize(context);
  // dotenv.config({ path: path.join(context.extensionPath, '.env') });

  // console.log('Arkhe Extension is active!');

  const disposable = vscode.commands.registerCommand("arkhe.openChat", () => {
    // Startup performance tracking
    const startup = new StartupTracker();

    const panel = vscode.window.createWebviewPanel(
      "reactWebview",
      "React VS Code Extension",
      vscode.ViewColumn.One,
      {
        enableScripts: true,

        retainContextWhenHidden: true,

        localResourceRoots: [
          vscode.Uri.joinPath(context.extensionUri, "out"),
          vscode.Uri.joinPath(context.extensionUri, "webview-ui", "build"),
          context.extensionUri,
        ],
      }
    );
    startup.markStep("1_panel_create");

    panel.webview.html = getWebviewContent(panel.webview, context.extensionUri);
    startup.markStep("2_html_inject");

    // Instantiate command handler
    const handler = new CommandHandler(panel);
    startup.markStep("3_handler_setup");

    // Message receiver - finalize startup timing on first message
    let startupFinalized = false;
    panel.webview.onDidReceiveMessage(async (message: MessageToBackend) => {
      if (!startupFinalized) {
        startup.markStep("4_first_message");
        startup.finalize();
        startupFinalized = true;
      }
      await handler.handle(message);
    });
  });

  context.subscriptions.push(disposable);
}

// This helper function generates the HTML structure that hosts the React app
function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
  // 1. Define the absolute path to the final built index.html
  const buildFolderUri = vscode.Uri.joinPath(
    extensionUri,
    "webview-ui",
    "build"
  );
  const htmlPath = vscode.Uri.joinPath(buildFolderUri, "index.html");

  // 2. Read the built HTML file content from disk
  // NOTE: This requires @types/node and synchronous reading is safe in activation context
  let htmlContent = fs.readFileSync(htmlPath.fsPath, "utf8");

  // 3. Generate the nonce for security
  const nonce = getNonce();

  // 4. Generate SECURE URI FOR BASE ASSETS (e.g., /webview-ui/build/)
  const buildUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "webview-ui", "build")
  );

  // 5. Inject the secure URI, CSP, and nonce into the HTML content
  htmlContent = htmlContent
    // Remove the insecure Mermaid CDN link if present (CRUCIAL)
    .replace(
      '<script src="https://cdn.jsdelivr.net/npm/mermaid@10.8.0/dist/mermaid.min.js"></script>',
      ""
    )

    // Convert asset paths (./assets/*) to VS Code resource URIs so they pass CSP
    .replace(/(src|href)="(\.\/assets\/[^"]+)"/g, (_, attr, originalPath) => {
      const assetUri = webview.asWebviewUri(
        vscode.Uri.joinPath(
          buildFolderUri,
          ...originalPath.replace(/^\.\//, "").split("/")
        )
      );
      return `${attr}="${assetUri.toString()}"`;
    })

    // Inject the CSP meta tag and set the <base> tag (for relative paths in the built HTML)
    .replace(
      "</head>",
      `
      <base href="${buildUri.toString()}/">
      <meta http-equiv="Content-Security-Policy" content="
          default-src 'none';
         style-src ${webview.cspSource} 'unsafe-inline' https: data:;
          img-src ${webview.cspSource} https: data:;
          script-src 'nonce-${nonce}' ${webview.cspSource} https:;
          font-src https: data:;
      ">
      </head>
    `
    )
    // Inject the nonce into the main script tag (assumes Vite generated a single script tag)
    // You might need to adjust the regex depending on your Vite output's script tag format.
    .replace("<script", `<script nonce="${nonce}"`);

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
