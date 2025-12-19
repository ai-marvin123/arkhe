import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { aiService } from '../services/AiService';
import { SessionManager } from '../managers/SessionManager';
import { MessageToFrontend, MessageToBackend, AiPayload } from '../types';
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
