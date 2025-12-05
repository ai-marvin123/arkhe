import type { Node, Edge, ChatLog } from "./diagramTypes";

//define initalState structure
export const initialState = {
  //A. Session id to send to BE
  session: {
    sessionId: "",
  },
  // B. Current diagram
  diagram: {
    jsonStructure: { nodes: [] as Node[], edges: [] as Edge[] },
    mermaidSyntax: "",
  },

  // C. Current view
  view: {
    zoomLevel: 1.0,
    panX: 0,
    panY: 0,
    isFullscreen: false,
    isLoading: false,
    lastLLMMessage: "",
    activeEntryId: "",
  },
  // D. AI Chat log
  chat: {
    log: [] as ChatLog, // Array of { id, role, text, type, diagramData, viewSettings, ... }
    currentInput: "",
  },
};
