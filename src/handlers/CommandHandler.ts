import * as vscode from 'vscode';

export class CommandHandler {
  public static async handle(
    panel: vscode.WebviewPanel,
    message: any,
    context: vscode.ExtensionContext
  ) {
    // Log for debugging
    console.log(`[CommandHandler] Received: ${message.command}`);

    switch (message.command) {
      case 'GENERATE_STRUCTURE':
        // TODO: Invoke AiService.generateStructure()
        console.log('TODO: Handle GENERATE_STRUCTURE');
        break;

      case 'RESET_SESSION':
        // TODO: Invoke SessionManager.clearSession()
        console.log('TODO: Handle RESET_SESSION');
        break;

      case 'showWarning':
        vscode.window.showWarningMessage(message.text);
        break;

      default:
        console.warn(`Unknown command: ${message.command}`);
    }
  }
}
