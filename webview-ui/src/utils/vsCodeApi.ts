import type { BackendMessage } from "../state/diagramTypes";
declare global {
  interface VsCodeApi {
    postMessage(message: unknown): void;
    getState<T>(): T | undefined;
    setState<T>(state: T): void;
  }

  function acquireVsCodeApi(): VsCodeApi;
}

// const vscode = acquireVsCodeApi(); -> this line was the problem

// Variable to hold the singleton instance
let vscodeApi: VsCodeApi | undefined = undefined;

/**
 * SAFELY acquires and returns the VS Code messaging API instance.
 * @throws {Error} if called outside the VS Code Webview host.
 */

function getVsCodeApi(): VsCodeApi {
  if (vscodeApi) {
    return vscodeApi; // Return cached instance if already initialized
  }

  // Check if the global acquisition function exists (guards against ReferenceError in browser)
  if (typeof acquireVsCodeApi !== "function") {
    throw new Error(
      "VSCODE_API_ERROR: Cannot find acquireVsCodeApi. Are you running in a VS Code Webview?"
    );
  }

  // Call the global function and cache the result
  vscodeApi = acquireVsCodeApi();
  return vscodeApi;
}

// // Send the user prompt + current sessionId to the extension so it can generate a response.
export function requestStructure(
  sessionId: string,
  prompt: string
): Promise<BackendMessage> {
  const vsCodeApi = getVsCodeApi(); // --> added this here, INSIDE requestStrucure inside of outside

  return new Promise((resolve, reject) => {
    const listener = (event: MessageEvent) => {
      const message = event.data;

      if (message.command === "AI_RESPONSE") {
        window.removeEventListener("message", listener);
        resolve(message);
        return;
      }
      //ADD REJECT LOGIC
      if (message.command === "ERROR") {
        window.removeEventListener("message", listener);
        reject(
          new Error(
            message.payload.message ||
              "An unknown error occured during processing"
          )
        );
        return;
      }
    };

    window.addEventListener("message", listener);

    vsCodeApi.postMessage({
      command: "GENERATE_STRUCTURE",
      payload: { sessionId, prompt },
    });
  });
}

// GET MESSAGES FROM BACKEND
// Subscribe to backend -> frontend messages (AI_RESPONSE, PROCESSING_STATUS, ERROR, and payload).

// export function onBackendMessage(
//   handler: (event: MessageEvent<{ command: string; payload: unknown }>) => void
// ) {
//   window.addEventListener("message", handler);
//   return () => window.removeEventListener("message", handler);
// }
