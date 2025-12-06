import type { DiagramState } from '../../webview-ui/src/state/diagramTypes.ts';
export const mockInitialState: DiagramState = {
  //A. Session id to send to BE
  session: {
    sessionId: '',
  },
  // B. Current diagram
  diagram: {
    jsonStructure: { nodes: [], edges: [] },
    mermaidSyntax: '',
  },

  // C. Current view
  view: {
    zoomLevel: 1.0,
    panX: 0,
    panY: 0,
    isFullscreen: false,
    isLoading: false,
    lastLLMMessage: '',
  },
  // D. AI Chat log
  chat: {
    log: [], // Array of { id, role, text, type, diagramData, viewSettings, ... }
    currentInput: '',
  },
};
