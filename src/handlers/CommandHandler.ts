import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { aiService } from '../services/AiService';
import { SessionManager } from '../managers/SessionManager';
import { MessageToFrontend, MessageToBackend, AiPayload } from '../types';
import { FileService } from '../services/FileService';
import { DriftService } from '../services/DriftService';
import { ConfigManager } from '../managers/ConfigManager';

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

          const successPayload = {
            type: 'DIAGRAM_SAVED',
            message: 'Diagram saved successfully.',
          };

          this.panel.webview.postMessage({
            command: 'AI_RESPONSE',
            payload: successPayload,
          });

          await aiService.saveContext(
            sessionId,
            'User manually saved the current architecture plan to disk.',
            {
              ...successPayload,
              data: diagramData,
            } as any
          );

          break;
        }

        case 'LOAD_DIAGRAM': {
          const { sessionId } = msg.payload;
          const saved = await this.fileService.loadDiagram(sessionId);

          console.log('Backend - LOAD_DIAGRAM - sessionId: ', msg);

          let response: MessageToFrontend;

          if (saved) {
            const successPayload: AiPayload = {
              type: 'DIAGRAM',
              message: 'Diagram loaded successfully from storage.',
              data: saved,
            };

            response = {
              command: 'AI_RESPONSE',
              payload: successPayload,
            };

            this.panel.webview.postMessage(response);

            await aiService.saveContext(
              sessionId,
              'Load the previously saved architecture plan.',
              successPayload as any
            );
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

          // 1. LOAD PLAN (Nodes + Edges)
          const savedDiagram = await this.fileService.loadDiagram(sessionId);
          if (!savedDiagram) {
            this.panel.webview.postMessage({
              command: 'AI_RESPONSE',
              payload: {
                type: 'NO_SAVED_DIAGRAM',
                message:
                  'No saved architecture plan found. Please save a plan first.',
              },
            });
            break;
          }

          const planNodes = savedDiagram.jsonStructure.nodes;
          const planEdges = savedDiagram.jsonStructure.edges ?? [];

          // 2. SCAN ACTUAL (Nodes + Edges)
          // 🔥 NOW RETURNS FULL GRAPH (Nodes + Edges)
          const { nodes: actualNodes, edges: actualEdges } =
            await this.fileService.scanDirectory(sessionId);

          // 3. CALCULATE DRIFT
          const { matched, missing, untracked } = DriftService.calculateDrift(
            planNodes,
            actualNodes
          );

          let responsePayload: AiPayload;

          // --- SCENARIO A: ALL MATCHED ---
          if (missing.length === 0 && untracked.length === 0) {
            responsePayload = {
              type: 'ALL_MATCHED',
              message: 'Structure is perfectly synced with the codebase.',
            };
          }
          // --- SCENARIO B: MISSING ONLY ---
          else if (missing.length > 0 && untracked.length === 0) {
            const aiMessage = await aiService.analyzeDrift(missing);
            const viewNodes = [...matched, ...missing];
            responsePayload = {
              type: 'MISSING_DIAGRAM',
              message: aiMessage,
              data: DriftService.generateDiagramData(viewNodes, planEdges),
            };
          }
          // --- SCENARIO C: UNTRACKED ONLY ---
          else if (missing.length === 0 && untracked.length > 0) {
            const viewNodes = [...matched, ...untracked];
            responsePayload = {
              type: 'UNTRACKED_DIAGRAM',
              message: 'Found new untracked files in your repository.',
              data: DriftService.generateDiagramData(viewNodes, actualEdges),
            };
          }
          // --- SCENARIO D: MIXED DRIFT ---
          else {
            const aiMessage = await aiService.analyzeDrift(missing);

            const missingNodes = [...matched, ...missing];
            const missingDiagramData = DriftService.generateDiagramData(
              missingNodes,
              planEdges
            );

            const untrackedNodes = [...matched, ...untracked];
            const untrackedDiagramData = DriftService.generateDiagramData(
              untrackedNodes,
              actualEdges
            );

            responsePayload = {
              type: 'MIXED_DIAGRAM',
              message: aiMessage,
              missingDiagramData: missingDiagramData,
              untrackedDiagramData: untrackedDiagramData,
            };
          }

          this.panel.webview.postMessage({
            command: 'AI_RESPONSE',
            payload: responsePayload,
          });

          await aiService.saveContext(
            sessionId,
            'Run drift detection check on current codebase.',
            responsePayload
          );

          break;
        }

        case 'SYNC_TO_ACTUAL': {
          const { sessionId } = msg.payload;

          // 1. Get the "Truth" (Actual Graph)
          const { nodes: actualNodes, edges: actualEdges } =
            await this.fileService.scanDirectory(sessionId);

          if (actualNodes.length === 0) {
            this.panel.webview.postMessage({
              command: 'AI_RESPONSE',
              payload: {
                type: 'TEXT',
                message: 'Workspace is empty. Cannot sync.',
              },
            });
            break;
          }

          // 2. Construct Clean Data

          const cleanNodes = actualNodes.map((node) => ({
            ...node,
            status: undefined, // Clear DriftStatus
          }));

          const newDiagramData = DriftService.generateDiagramData(
            cleanNodes,
            actualEdges // ✅ Use the edges calculated from disk scan
          );

          // 3. Save
          await this.fileService.saveDiagram(sessionId, newDiagramData);

          const responsePayload = {
            type: 'DIAGRAM',
            message: 'Diagram successfully synced with the actual codebase.',
            data: newDiagramData,
          };

          this.panel.webview.postMessage({
            command: 'AI_RESPONSE',
            payload: responsePayload as any, // Cast type cho gọn
          });

          await aiService.saveContext(
            sessionId,
            'Sync architecture plan to match actual codebase files.',
            responsePayload as any
          );

          break;
        }

        case 'GET_SETTINGS': {
          const configManager = ConfigManager.getInstance();

          const isConfigured = await configManager.isConfigured();
          const config = configManager.getConfig();

          console.log('isConfigured: ', isConfigured);
          console.log('config: ', config);

          this.panel.webview.postMessage({
            command: 'SETTINGS_STATUS',
            payload: { isConfigured, config },
          });

          break;
        }

        case 'SAVE_SETTINGS': {
          console.log('SAVE_SETTINGS received:', msg.payload);
          const { apiKey, provider, model } = msg.payload ?? {};

          // Basic validation
          if (!provider || !model) {
            this.sendError('SAVE_SETTINGS missing provider or model.');
            break;
          }

          const configManager = ConfigManager.getInstance();

          // 1. RESOLVE CANDIDATE KEY (The key to be verified)
          // Scenario A: User entered a NEW key -> Verify this new key.
          // Scenario B: User left key blank (only changing model) -> Fetch existing key to verify against new model.
          let keyToVerify = apiKey?.trim();

          if (!keyToVerify) {
            keyToVerify = await configManager.getApiKey();
          }

          // Edge Case: No key provided AND no key in storage (First time setup with empty field)
          if (!keyToVerify) {
            this.panel.webview.postMessage({
              command: 'SETTINGS_ERROR',
              payload: {
                success: false,
                // message: 'API Key is required.',
              },
            });
            break;
          }

          // 2. VERIFY CONNECTION (Ping OpenAI)
          // We must ensure the (Key + Model) combination works before saving.
          const isValid = await aiService.verifyApiKey(keyToVerify, model);

          if (!isValid) {
            // ❌ FAILURE: Send error to Frontend and STOP.
            this.panel.webview.postMessage({
              command: 'SETTINGS_ERROR',
              payload: {
                success: false,
                // message:
                //   'Connection failed. Please check your API Key and Model permissions.',
              },
            });
            break; // Do NOT save anything
          }

          // 3. SAVE TO STORAGE (Only if verified)

          // Only update SecretStorage if the user explicitly provided a NEW key string.
          // If they left it blank, we keep the old valid key.
          if (apiKey && apiKey.trim().length > 0) {
            await configManager.setApiKey(apiKey);
          }

          // Always update non-sensitive config (Provider, Model)
          await configManager.saveConfig(provider, model);

          // 4. RESET & CONFIRM

          // Important: Clear cached model instances in AiService so the next request uses the new settings.
          aiService.updateModelConfiguration();

          // ✅ SUCCESS: Tell Frontend everything is good.
          this.panel.webview.postMessage({
            command: 'SETTINGS_SAVED',
            payload: { success: true },
          });

          break;
        }

        case 'OPEN_FILE': {
          try {
            const { path } = msg.payload;

            const absolutePath = this.fileService.resolveAbsolutePath(path);
            if (!absolutePath) {
              throw new Error(`Unable to resolve path: ${path}`);
            }

            const uri = vscode.Uri.file(absolutePath);

            await vscode.window.showTextDocument(uri, {
              viewColumn: vscode.ViewColumn.Beside,
              preview: false,
            });
          } catch (err) {
            console.error('[CommandHandler] OPEN_FILE failed:', err);
            this.sendError('Failed to open file.');
          }
          break;
        }
        case 'OPEN_FOLDER': {
          try {
            const { path } = msg.payload;

            const absolutePath = this.fileService.resolveAbsolutePath(path);
            if (!absolutePath) {
              throw new Error(`Unable to resolve path: ${path}`);
            }

            const uri = vscode.Uri.file(absolutePath);

            await vscode.commands.executeCommand('revealInExplorer', uri);
          } catch (err) {
            console.error('[CommandHandler] OPEN_FOLDER failed:', err);
            this.sendError('Failed to reveal folder in Explorer.');
          }
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
