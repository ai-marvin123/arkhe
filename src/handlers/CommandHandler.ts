import * as vscode from 'vscode';
import { aiService } from '../services/AiService';
import { SessionManager } from '../managers/SessionManager';
import { MessageToFrontend, MessageToBackend } from '../types';
import { FileService } from '../services/FileService';
import { DriftService } from '../services/DriftService';

export class CommandHandler {
  constructor(
    private panel: vscode.WebviewPanel,
    private fileService = FileService // default real service, mockable in tests
  ) {}

  async handle(msg: MessageToBackend) {
    try {
      switch (msg.command) {
        case 'GENERATE_STRUCTURE': {
          const { sessionId, prompt } = msg.payload;

          console.log('sessionId:', sessionId);
          console.log('prompt:', prompt);

          const aiResponsePayload = await aiService.generateStructure(
            sessionId,
            prompt
          );

          const responseMsg: MessageToFrontend = {
            command: 'AI_RESPONSE',
            payload: aiResponsePayload,
          };

          this.panel.webview.postMessage(responseMsg);
          break;
        }

        case 'RESET_SESSION': {
          const { sessionId } = msg.payload;

          SessionManager.getInstance().clearSession(sessionId);

          this.panel.webview.postMessage({
            command: 'AI_RESPONSE',
            payload: {
              type: 'TEXT',
              message: `Session ${sessionId} has been reset. Memory cleared.`,
            },
          });

          break;
        }

        case 'SAVE_DIAGRAM': {
          const { sessionId, diagramData } = msg.payload;

          await this.fileService.saveDiagram(sessionId, diagramData);

          this.panel.webview.postMessage({
            command: 'AI_RESPONSE',
            payload: {
              type: 'DIAGRAM_SAVED',
              message: 'Diagram saved successfully.',
            },
          });

          break;
        }

        case 'LOAD_DIAGRAM': {
          const { sessionId } = msg.payload;
          const saved = await this.fileService.loadDiagram(sessionId);

          console.log('Backend - LOAD_DIAGRAM - sessionId: ', msg);

          let response: MessageToFrontend;

          if (saved) {
            response = {
              command: 'AI_RESPONSE',
              payload: {
                type: 'DIAGRAM',
                message: 'Diagram loaded',
                data: saved,
              },
            };
          } else {
            response = {
              command: 'AI_RESPONSE',
              payload: {
                type: 'NO_SAVED_DIAGRAM',
                message: 'No diagram found.',
              },
            };
          }

          this.panel.webview.postMessage(response);
          break;
        }
      
        case 'CHECK_DRIFT': {
  const { sessionId } = msg.payload ?? {};

  // 1. Load saved plan
  const savedDiagram = await this.fileService.loadDiagram(sessionId);

  if (!savedDiagram) {
    this.panel.webview.postMessage({
      command: 'AI_RESPONSE',
      payload: {
        type: 'MISSING_DIAGRAM',
        message: 'No saved architecture plan found. Please save a plan first.',
      },
    });
    break;
  }

  // 2. Scan actual disk
  const planNodes = savedDiagram.jsonStructure.nodes;
  const actualNodes = await this.fileService.scanDirectory(sessionId);
  
  // 🟨 Edge Case: Empty workspace
  if (actualNodes.length === 0) {
    this.panel.webview.postMessage({
      command: 'AI_RESPONSE',
      payload: {
        type: 'TEXT',
        message: 'Workspace is empty. No files to compare against.',
      },
    });
    break;
  }

  // 3. Calculate drift
  const { matched, missing, untracked } =
    DriftService.calculateDrift(planNodes, actualNodes);

  // 4. Build drift diagram ONCE
  const driftNodes = [...matched, ...missing, ...untracked];
  const edges = savedDiagram.jsonStructure.edges ?? [];
  const diagramData = DriftService.generateDiagramData(driftNodes, edges);

  //All Matched
  if (missing.length === 0 && untracked.length === 0) {
    this.panel.webview.postMessage({
      command: 'AI_RESPONSE',
      payload: {
        type: 'ALL_MATCHED',
        message: '✅ Structure is perfectly synced with the codebase.',
      },
    });
    break;
  }

  //Missing
  if (missing.length > 0 && untracked.length === 0) {
    const aiMessage = await aiService.analyzeDrift(missing);

    this.panel.webview.postMessage({
      command: 'AI_RESPONSE',
      payload: {
        type: 'MISSING_DIAGRAM',
        message: aiMessage,
        data: diagramData,
      },
    });
    break;
  }

  //Untracked
  if (missing.length === 0 && untracked.length > 0) {
    this.panel.webview.postMessage({
      command: 'AI_RESPONSE',
      payload: {
        type: 'UNTRACKED_DIAGRAM',
        message: 'ℹ️ Found new untracked files in your repository.',
        data: diagramData,
      },
    });
    break;
  }

  //Mixed
  const aiMessage = await aiService.analyzeDrift(missing);

  // 1️⃣ Missing
  this.panel.webview.postMessage({
    command: 'AI_RESPONSE',
    payload: {
      type: 'MISSING_DIAGRAM',
      message: aiMessage,
      data: diagramData,
    },
  });

  // 2️⃣ Untracked
  this.panel.webview.postMessage({
    command: 'AI_RESPONSE',
    payload: {
      type: 'UNTRACKED_DIAGRAM',
      message: 'ℹ️ Found new untracked files in your repository.',
      data: diagramData,
    },
  });

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