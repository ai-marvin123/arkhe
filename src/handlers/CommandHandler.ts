import * as vscode from 'vscode';
import { aiService } from '../services/AiService';
import { SessionManager } from '../managers/SessionManager';
import { MessageToFrontend, MessageToBackend } from '../types';

export class CommandHandler {
  constructor(private panel: vscode.WebviewPanel) {}

  async handle(msg: MessageToBackend) {
    try {
      switch (msg.command) {
        case 'GENERATE_STRUCTURE': {
          const { sessionId, prompt } = msg.payload;

          console.log('sessionId: ', sessionId);
          console.log('prompt: ', prompt);

          const AiPayload = await aiService.generateStructure(
            sessionId,
            prompt
          );

          const responseMsg: MessageToFrontend = {
            command: 'AI_RESPONSE',
            payload: AiPayload,
          };

          this.panel.webview.postMessage(responseMsg);

          break;
        }

        case 'RESET_SESSION': {
          const { sessionId } = msg.payload;

          // Clear history from SessionManager
          SessionManager.getInstance().clearSession(sessionId);

          // Send a confirmation text back to the chat so the user knows it happened
          const resetResponse: MessageToFrontend = {
            command: 'AI_RESPONSE',
            payload: {
              type: 'TEXT',
              message: `Session ${sessionId} has been reset. Memory cleared.`,
            },
          };

          this.panel.webview.postMessage(resetResponse);
          break;
        }
      }
    } catch (err: any) {
      this.sendError(
        `CommandHandler failed: ${err?.message ?? 'Unexpected error'}`
      );
    }
  }

  private sendError(message: string): void {
    this.panel.webview.postMessage({
      command: 'ERROR',
      payload: { message },
    });
  }
}
