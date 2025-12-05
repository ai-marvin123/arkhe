import * as vscode from 'vscode';
import { MockService } from '../services/MockService';
import { FrontendMessage, BackendMessage, AiResponsePayload } from '../types';
import { SessionManager } from '../managers/SessionManager';

export class CommandHandler {
  static async handle(
    panel: vscode.WebviewPanel,
    message: FrontendMessage
  ): Promise<void> {
    console.log(`[CommandHandler] Received command: ${message.command}`);

    switch (message.command) {
      case 'GENERATE_STRUCTURE': {
        const { sessionId, prompt } = message.payload;

        const mockData = MockService.getMockResponse(
          prompt
        ) as AiResponsePayload;

        await new Promise((resolve) => setTimeout(resolve, 500));

        const responseMsg: BackendMessage = {
          command: 'AI_RESPONSE',
          payload: mockData,
        };

        panel.webview.postMessage(responseMsg);
        break;
      }

      case 'RESET_SESSION': {
        const { sessionId } = message.payload;

        // Clear history from SessionManager
        SessionManager.getInstance().clearSession(sessionId);

        // Send a confirmation text back to the chat so the user knows it happened
        const resetResponse: BackendMessage = {
          command: 'AI_RESPONSE',
          payload: {
            type: 'TEXT',
            message: `Session ${sessionId} has been reset. Memory cleared.`,
          },
        };

        panel.webview.postMessage(resetResponse);
        break;
      }

      default: {
        console.warn(`[CommandHandler] Unknown command received.`);
      }
    }
  }
}
