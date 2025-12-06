import { initialState } from "./initialState.js";

export type DiagramState = typeof initialState;
export type DiagramDispatch = (action: DiagramAction) => void;

export type DiagramAction =
  | { type: "initialize_session"; payload: { sessionId: string } }
  | { type: "set_userInput"; payload: string }
  | { type: "send_userInput"; payload?: void }
  | {
      type: "load_newDiagram";
      payload: {
        message: string;
        data: DiagramData;
      };
    }
  | { type: "load_textOnly"; payload: { message: string } }
  | {
      type: "update_logEntry";
      payload: { id: string; zoomLevel?: number; panX?: number; panY?: number };
    };
export type ViewSettings = {
  zoomLevel: number;
  panX: number;
  panY: number;
  isFullscreen: boolean;
  isLoading: boolean;
  lastLLMMessage: string;
};
export type Node = {
  id: string;
  label: string;
  type: "FILE" | "FOLDER";
  level: number;
  path: string;
  parentId?: string;
};

export type Edge = {
  source: string;
  target: string;
};

export type DiagramData = {
  mermaidSyntax: string;
  jsonStructure: {
    nodes: Node[];
    edges: Edge[];
  };
};

type DiagramEntryType = "DIAGRAM_CONTENT" | "VIEW_ARCHIVE";
type TextEntryType = "TEXT_INPUT" | "TEXT_RESPONSE";

export type DiagramEntry = {
  id: string;
  role: string;
  type: DiagramEntryType;
  text: string;
  diagramData: DiagramData | null;
  viewSettings: ViewSettings;
  contentRefId: string | null;
  timestamp: number;
};

export type TextEntry = {
  id: string;
  role: string;
  type: TextEntryType;
  text: string;
  timestamp: number;
};

export type AiResponsePayload =
  | { type: "TEXT"; message: string; data?: never }
  | { type: "DIAGRAM"; message: string; data: DiagramData };

export type BackendMessage = {
  command: "AI_RESPONSE";
  payload: AiResponsePayload;
};

export type ChatLog = (TextEntry | DiagramEntry)[];
