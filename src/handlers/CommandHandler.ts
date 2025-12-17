import * as fs from 'fs';
import * as path from 'path';
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

          // --- SCENARIO A: ALL MATCHED ---
          if (missing.length === 0 && untracked.length === 0) {
            this.panel.webview.postMessage({
              command: 'AI_RESPONSE',
              payload: {
                type: 'ALL_MATCHED',
                message: 'Structure is perfectly synced with the codebase.',
              },
            });
            break;
          }

          // --- SCENARIO B: MISSING ONLY ---
          if (missing.length > 0 && untracked.length === 0) {
            const aiMessage = await aiService.analyzeDrift(missing);

            const viewNodes = [...matched, ...missing];

            this.panel.webview.postMessage({
              command: 'AI_RESPONSE',
              payload: {
                type: 'MISSING_DIAGRAM',
                message: aiMessage,
                // ✅ Use PLAN EDGES directly
                data: DriftService.generateDiagramData(viewNodes, planEdges),
              },
            });
            break;
          }

          // --- SCENARIO C: UNTRACKED ONLY ---
          if (missing.length === 0 && untracked.length > 0) {
            const viewNodes = [...matched, ...untracked];

            this.panel.webview.postMessage({
              command: 'AI_RESPONSE',
              payload: {
                type: 'UNTRACKED_DIAGRAM',
                message: 'Found new untracked files in your repository.',
                // ✅ Use ACTUAL EDGES directly
                data: DriftService.generateDiagramData(viewNodes, actualEdges),
              },
            });
            break;
          }

          // --- SCENARIO D: MIXED DRIFT ---
          const aiMessage = await aiService.analyzeDrift(missing);

          // 1. Missing View (Use Plan Edges)
          const missingNodes = [...matched, ...missing];
          const missingDiagramData = DriftService.generateDiagramData(
            missingNodes,
            planEdges // ✅ Clean & Simple
          );

          // 2. Untracked View (Use Actual Edges)
          const untrackedNodes = [...matched, ...untracked];
          const untrackedDiagramData = DriftService.generateDiagramData(
            untrackedNodes,
            actualEdges // ✅ Clean & Simple
          );

          const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

          if (rootPath) {
            try {
              // 1. Save Missing Diagram
              const missingPath = path.join(rootPath, 'debug_missing.json');
              fs.writeFileSync(
                missingPath,
                JSON.stringify(missingDiagramData, null, 2)
              );
              console.log(`[DEBUG] Saved missing diagram to: ${missingPath}`);

              // 2. Save Untracked Diagram
              const untrackedPath = path.join(rootPath, 'debug_untracked.json');
              fs.writeFileSync(
                untrackedPath,
                JSON.stringify(untrackedDiagramData, null, 2)
              );
              console.log(
                `[DEBUG] Saved untracked diagram to: ${untrackedPath}`
              );

              const actualPath = path.join(rootPath, 'actual.json');
              fs.writeFileSync(
                missingPath,
                JSON.stringify(
                  { nodes: actualNodes, edges: actualEdges },
                  null,
                  2
                )
              );
              // nodes: actualNodes, edges: actualEdges
            } catch (err) {
              console.error('[DEBUG] Failed to save debug files:', err);
            }
          }

          this.panel.webview.postMessage({
            command: 'AI_RESPONSE',
            payload: {
              type: 'MIXED_DIAGRAM',
              message: aiMessage,
              missingDiagramData: missingDiagramData,
              untrackedDiagramData: untrackedDiagramData,
            },
          });
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
          // Since scanDirectory now returns correct parent-child edges,
          // we can directly use 'actualEdges' to ensure the tree is connected.
          // Note: If we want to preserve *custom manual* edges from the old plan,
          // we would need more complex merging logic. For now, strict sync is safer.

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

          // 4. Respond
          this.panel.webview.postMessage({
            command: 'AI_RESPONSE',
            payload: {
              type: 'DIAGRAM',
              message: 'Diagram successfully synced with the actual codebase.',
              data: newDiagramData,
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
