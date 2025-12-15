import type { DiagramData } from "../state/diagramTypes";
import type {
  MessageToFrontend,
  SaveResponse,
  LoadSavedDiagramResponse,
} from "../utils/ipcTypes";
declare global {
  interface VsCodeApi {
    postMessage(message: unknown): void;
    getState<T>(): T | undefined;
    setState<T>(state: T): void;
  }

  function acquireVsCodeApi(): VsCodeApi;
}

let vscodeApi: VsCodeApi | undefined = undefined;

//lazy initialization helper function
function getVsCodeApi(): VsCodeApi {
  if (vscodeApi) {
    return vscodeApi;
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
): Promise<MessageToFrontend> {
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

//send SSID upon starting app for saved diagram check

export function loadSavedDiagram(
  sessionId: string
): Promise<LoadSavedDiagramResponse> {
  const vsCodeApi = getVsCodeApi();

  return new Promise((resolve, reject) => {
    const listener = (event: MessageEvent) => {
      const message = event.data;

      if (message.command === "AI_RESPONSE") {
        // waiting for nam to send data structure
        window.removeEventListener("message", listener);
        resolve(message);
        return;
      }

      if (message.command === "ERROR") {
        window.removeEventListener("message", listener);
        reject(
          new Error(
            message.payload.message ||
              "An unknown error occurred during exisitng diagram check."
          )
        );
        return;
      }
    };

    window.addEventListener("message", listener);

    vsCodeApi.postMessage({
      command: "LOAD_DIAGRAM",
      payload: { sessionId },
    });
  });
}

//save diagram post request

export function postDiagramToSave(
  sessionId: string,
  diagramData: DiagramData
): Promise<SaveResponse> {
  const vsCodeApi = getVsCodeApi();

  return new Promise((resolve, reject) => {
    const listener = (event: MessageEvent) => {
      const message = event.data;

      if (message.command === "AI_RESPONSE") {
        window.removeEventListener("message", listener);
        resolve(message);
        return;
      }

      if (message.command === "ERROR") {
        window.removeEventListener("message", listener);
        reject(
          new Error(
            message.payload.message ||
              "An unknown error occured while attempting to save diagram"
          )
        );
      }
      return;
    };
    window.addEventListener("message", listener);

    vsCodeApi.postMessage({
      command: "SAVE_DIAGRAM",
      payload: { sessionId, diagramData },
    });
  });
}

export function requestAlignmentCheck(
  sessionId: string
): Promise<MessageToFrontend> {
  const vsCodeApi = getVsCodeApi();

  return new Promise((resolve, reject) => {
    const listener = (event: MessageEvent) => {
      const message = event.data;

      if (message.command === "AI_RESPONSE") {
        window.removeEventListener("message", listener);
        resolve(message);
        return;
      }

      if (message.command === "ERROR") {
        window.removeEventListener("message", listener);
        reject(
          new Error(
            message.payload?.message ||
              "An unknown error occurred during drift check."
          )
        );
      }
    };

    window.addEventListener("message", listener);

    vsCodeApi.postMessage({
      command: "CHECK_DRIFT",
      payload: { sessionId },
    });
  });
}

export function requestDiagramSync(
  sessionId: string
): Promise<MessageToFrontend> {
  const vsCodeApi = getVsCodeApi();

  return new Promise((resolve, reject) => {
    const listener = (event: MessageEvent) => {
      const message = event.data;

      if (message.command === "AI_RESPONSE") {
        window.removeEventListener("message", listener);
        resolve(message);
        return;
      }

      if (message.command === "ERROR") {
        window.removeEventListener("message", listener);
        reject(
          new Error(
            message.payload?.message ||
              "An unknown error occurred while syncing the diagram."
          )
        );
      }
    };

    window.addEventListener("message", listener);

    vsCodeApi.postMessage({
      command: "SYNC_TO_ACTUAL",
      payload: { sessionId },
    });
  });
}

// GET MESSAGES FROM BACKEND
// Subscribe to backend -> frontend messages (AI_RESPONSE, PROCESSING_STATUS, ERROR, and payload).

// export function onMessageToFrontend(
//   handler: (event: MessageEvent<{ command: string; payload: unknown }>) => void
// ) {
//   window.addEventListener("message", handler);
//   return () => window.removeEventListener("message", handler);
// }
