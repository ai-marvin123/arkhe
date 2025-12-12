import { initialState } from './initialState.js';

export type DiagramState = typeof initialState;
export type DiagramDispatch = (action: DiagramAction) => void;

export type DiagramAction =
  | { type: 'initialize_session'; payload: { sessionId: string } }
  | { type: 'enable_chat'; payload?: void }
  | { type: 'set_userInput'; payload: string }
  | { type: 'send_userInput'; payload?: void }
  | {
      type: 'load_newDiagram';
      payload: {
        message: string;
        data: DiagramData;
      };
    }
  | { type: 'load_textOnly'; payload: { message: string } }
  | {
      type: 'update_logEntry';
      payload: {
        id: string;
        zoomLevel?: number;
        panX?: number;
        panY?: number;
        isChatEnabled?: boolean;
        isFullscreen?: boolean;
        isLoading?: boolean;
        isPanActive?: boolean;
        lastLLMMessage?: string;
        isAIOpen?: boolean;
      };
    }
  | {
      type: 'proceed_guidedFlow';
      payload: {
        aiScriptText: string;
        nextStep: string;
        options: Options[];
        isExit: boolean;
      };
    }
  | {
      type: 'log_userChoice';
      payload: {
        logEntryId: string;
        chosenText: string;
      };
    };
export type ViewSettings = {
  zoomLevel: number;
  panX: number;
  panY: number;
  isChatEnabled: boolean;
  isFullscreen: boolean;
  isLoading: boolean;
  isPanActive: boolean;
  lastLLMMessage: string;
  isAIOpen: boolean;
  driftCheckStep: string;
};
export type Node = {
  id: string;
  label: string;
  type: 'FILE' | 'FOLDER';
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

export type DriftCheck =
  | 'IDLE'
  | 'ASK_FOR_DRIFT_CHECK'
  | 'ASK_FOR_SYNC'
  | 'ASK_FOR_EDIT';

type DiagramEntryType = 'DIAGRAM_CONTENT' | 'VIEW_ARCHIVE';
type TextEntryType = 'TEXT_INPUT' | 'TEXT_RESPONSE';
type Options = {
  text: string;
  action: string;
};

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
  options?: Options[];
  timestamp: number;
};

export type ChatLog = (TextEntry | DiagramEntry)[];
