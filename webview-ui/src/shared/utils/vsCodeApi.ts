import type { DiagramData } from '../../types/diagramTypes';
import type { Dispatch } from '../../features/drift/guidedFlow';
import type {
  MessageToFrontend,
  SaveResponse,
  LoadSavedDiagramResponse,
  SavedUserApiKey,
  UserApiKeySuccess,
} from '../../types/ipcTypes';
import { handleDriftCheckReport } from '../../features/drift/guidedFlow';
import type { DriftPayload } from '../../features/drift/guidedFlow';

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
  if (typeof acquireVsCodeApi !== 'function') {
    throw new Error(
      'VSCODE_API_ERROR: Cannot find acquireVsCodeApi. Are you running in a VS Code Webview?'
    );
  }

  vscodeApi = acquireVsCodeApi();
  return vscodeApi;
}

//********************************//
//        CHAT FEATURE            //
//********************************//

//send command to check for saved OpenAI key
export function checkUserApiKey(): Promise<SavedUserApiKey> {
  console.log('checkUserApiKey');

  const vsCodeApi = getVsCodeApi();
  return new Promise((resolve, reject) => {
    const listener = (event: MessageEvent) => {
      const message = event.data;

      if (message.command === 'SETTINGS_STATUS') {
        window.removeEventListener('message', listener);
        resolve(message.payload);
        return;
      }
      if (message.command === 'ERROR') {
        window.removeEventListener('message', listener);
        reject(
          new Error(
            message.payload.message ||
              'An unknown error occurred while checking saved user OpenAI key.'
          )
        );
        return;
      }
    };
    window.addEventListener('message', listener);

    vsCodeApi.postMessage({
      command: 'GET_SETTINGS',
    });
  });
}

//send user's OpenAI key
export function sendUserApiKey(
  provider: string,
  model: string,
  apiKey?: string
): Promise<UserApiKeySuccess> {
  const vsCodeApi = getVsCodeApi();
  return new Promise((resolve, reject) => {
    const listener = (event: MessageEvent) => {
      const message = event.data;

      if (message.command === 'SETTINGS_SAVED') {
        window.removeEventListener('message', listener);
        resolve(message);
        return;
      }
      if (message.command === 'ERROR') {
        window.removeEventListener('message', listener);
        reject(
          new Error(
            message.payload.message ||
              'An unknown error occurred while saving user OpenAI key.'
          )
        );
        return;
      }
    };
    window.addEventListener('message', listener);

    vsCodeApi.postMessage({
      command: 'SAVE_SETTINGS',
      payload: { provider: provider, model: model, apiKey: apiKey },
    });
  });
}

// Send the user prompt + current sessionId to the extension so it can generate a response.
export function requestStructure(
  sessionId: string,
  prompt: string
): Promise<MessageToFrontend> {
  const vsCodeApi = getVsCodeApi();

  return new Promise((resolve, reject) => {
    const listener = (event: MessageEvent) => {
      const message = event.data;

      if (message.command === 'AI_RESPONSE') {
        window.removeEventListener('message', listener);
        resolve(message);
        return;
      }
      //ADD REJECT LOGIC
      if (message.command === 'ERROR') {
        window.removeEventListener('message', listener);
        reject(
          new Error(
            message.payload.message ||
              'An unknown error occured during processing'
          )
        );
        return;
      }
    };

    window.addEventListener('message', listener);

    vsCodeApi.postMessage({
      command: 'GENERATE_STRUCTURE',
      payload: { sessionId, prompt },
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

      if (message.command === 'AI_RESPONSE') {
        window.removeEventListener('message', listener);
        resolve(message);
        return;
      }

      if (message.command === 'ERROR') {
        window.removeEventListener('message', listener);
        reject(
          new Error(
            message.payload.message ||
              'An unknown error occured while attempting to save diagram'
          )
        );
      }
      return;
    };
    window.addEventListener('message', listener);

    vsCodeApi.postMessage({
      command: 'SAVE_DIAGRAM',
      payload: { sessionId, diagramData },
    });
  });
}

//********************************//
//         DRIFT FEATURE          //
//********************************//

//send SSID upon starting app for saved diagram check
export function loadSavedDiagram(
  sessionId: string
): Promise<LoadSavedDiagramResponse> {
  const vsCodeApi = getVsCodeApi();

  return new Promise((resolve, reject) => {
    const listener = (event: MessageEvent) => {
      const message = event.data;

      if (message.command === 'AI_RESPONSE') {
        // waiting for nam to send data structure
        window.removeEventListener('message', listener);
        resolve(message);
        return;
      }

      if (message.command === 'ERROR') {
        window.removeEventListener('message', listener);
        reject(
          new Error(
            message.payload.message ||
              'An unknown error occurred during exisitng diagram check.'
          )
        );
        return;
      }
    };

    window.addEventListener('message', listener);

    vsCodeApi.postMessage({
      command: 'LOAD_DIAGRAM',
      payload: { sessionId },
    });
  });
}

export function requestAlignmentCheck(
  sessionId: string,
  dispatch: Dispatch
): Promise<MessageToFrontend> {
  const vsCodeApi = getVsCodeApi();

  return new Promise((resolve, reject) => {
    const listener = (event: MessageEvent) => {
      const message = event.data;

      if (message.command === 'AI_RESPONSE') {
        window.removeEventListener('message', listener);
        handleDriftCheckReport(message.payload as DriftPayload, dispatch);
        resolve(message);
        return;
      }

      if (message.command === 'ERROR') {
        window.removeEventListener('message', listener);
        reject(
          new Error(
            message.payload?.message ||
              'An unknown error occurred during drift check.'
          )
        );
      }
    };

    window.addEventListener('message', listener);

    vsCodeApi.postMessage({
      command: 'CHECK_DRIFT',
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

      if (message.command === 'AI_RESPONSE') {
        window.removeEventListener('message', listener);
        resolve(message);
        return;
      }

      if (message.command === 'ERROR') {
        window.removeEventListener('message', listener);
        reject(
          new Error(
            message.payload?.message ||
              'An unknown error occurred while syncing the diagram.'
          )
        );
      }
    };

    window.addEventListener('message', listener);

    vsCodeApi.postMessage({
      command: 'SYNC_TO_ACTUAL',
      payload: { sessionId },
    });
  });
}

//********************************//
//      CLICK TO OPEN FEATURE     //
//********************************//

export function openFileOnClick(path: string) {
  const vsCodeApi = getVsCodeApi();
  vsCodeApi.postMessage({
    command: 'OPEN_FILE',
    payload: { path },
  });
}

export function openFolderOnClick(path: string) {
  const vsCodeApi = getVsCodeApi();
  vsCodeApi.postMessage({
    command: 'OPEN_FOLDER',
    payload: { path },
  });
}
