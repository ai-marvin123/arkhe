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

          console.log('savedDiagram: ', savedDiagram);

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

          // 2. Scan actual disk
          const planNodes = savedDiagram.jsonStructure.nodes;
          const actualNodes = await this.fileService.scanDirectory(sessionId);

          // 3. Calculate drift
          const { matched, missing, untracked } = DriftService.calculateDrift(
            planNodes,
            actualNodes
          );

          // 4. Build drift diagram ONCE
          const driftNodes = [...matched, ...missing, ...untracked];
          const edges = savedDiagram.jsonStructure.edges ?? [];
          const diagramData = DriftService.generateDiagramData(
            driftNodes,
            edges
          );

          //All Matched
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
                message: 'Found new untracked files in your repository.',
                data: diagramData,
              },
            });
            break;
          }

          //Mixed
          const aiMessage = await aiService.analyzeDrift(missing);

          const filterValidEdges = (nodes: any[], allEdges: any[]) => {
            const activeIds = new Set(nodes.map((n) => n.id));
            return allEdges.filter(
              (edge) => activeIds.has(edge.source) && activeIds.has(edge.target)
            );
          };

          // 1. Prepare Data cho Missing View (Matched + Missing)
          const missingNodes = [...matched, ...missing];
          const missingEdges = filterValidEdges(missingNodes, edges);

          const missingDiagramData = DriftService.generateDiagramData(
            missingNodes,
            missingEdges
          );

          // 2. Prepare Data cho Untracked View (Matched + Untracked)
          const untrackedNodes = [...matched, ...untracked];
          const untrackedEdges = filterValidEdges(untrackedNodes, edges);

          const untrackedDiagramData = DriftService.generateDiagramData(
            untrackedNodes,
            untrackedEdges
          );

          // 3. Send frontend the mixed diagram
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

          // 1. Get the "Truth" (Actual files on disk)
          const actualNodes = await this.fileService.scanDirectory(sessionId);

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

          // 2. Try to preserve existing EDGES (Dependencies)
          // If we just overwrite, we lose all arrows. We should keep arrows
          // where both source and target still exist.
          const savedDiagram = await this.fileService.loadDiagram(sessionId);
          let validEdges: any[] = [];

          if (savedDiagram?.jsonStructure?.edges) {
            const actualNodeIds = new Set(actualNodes.map((n) => n.id));

            validEdges = savedDiagram.jsonStructure.edges.filter(
              (edge) =>
                actualNodeIds.has(edge.source) && actualNodeIds.has(edge.target)
            );
          }

          // 3. Construct clean nodes (Remove 'status' field to make them standard)
          const cleanNodes = actualNodes.map((node) => ({
            ...node,
            status: undefined, // Clear DriftStatus (MATCHED/MISSING/UNTRACKED)
          }));

          // 4. Generate full Diagram Data (using DriftService helper)
          const newDiagramData = DriftService.generateDiagramData(
            cleanNodes,
            validEdges
          );

          // 5. Save to overwrite .repoplan.json
          await this.fileService.saveDiagram(sessionId, newDiagramData);

          // 6. Send Response to Frontend
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
