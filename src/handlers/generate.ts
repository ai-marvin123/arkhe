import * as vscode from "vscode";
import { aiService } from "../services/AiService";
import { sessionManager } from "../managers/SessionManager";
import type { BackendMessage } from "../types";

export async function handleGeneration(
  panel: vscode.WebviewPanel,
  payload: { sessionId: string; prompt: string }
): Promise<void> {
  const { sessionId, prompt } = payload;

  // 🔹 Step 1: notify "analyzing"
  panel.webview.postMessage({
    command: "PROCESSING_STATUS",
    payload: { step: "analyzing" },
  } satisfies BackendMessage);

  // 🔹 Step 2: notify "generating"
  panel.webview.postMessage({
    command: "PROCESSING_STATUS",
    payload: { step: "generating" },
  } satisfies BackendMessage);

  let result;

  try {
    // 🔹 Step 3: ask AI
    result = await aiService.generateStructure(sessionId, prompt);

    // 🔹 Step 4: store history
    sessionManager.add(sessionId, {
      user: prompt,
      assistant: result.message,
    });

    // 🔹 Step 5: send valid AI payload
    panel.webview.postMessage({
      command: "AI_RESPONSE",
      payload: result,
    } satisfies BackendMessage);

  } catch (err: any) {
    // 🔻 Recoverable failure → send TEXT fallback
    panel.webview.postMessage({
      command: "AI_RESPONSE",
      payload: {
        type: "TEXT",
        message:
          err?.message ??
          "AI failed — please try rephrasing your request.",
      },
    } satisfies BackendMessage);
  }

  // 🔹 Always finish with done
  panel.webview.postMessage({
    command: "PROCESSING_STATUS",
    payload: { step: "done" },
  } satisfies BackendMessage);
}
