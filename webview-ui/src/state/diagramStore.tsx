import { useReducer, createContext } from 'react';

//define initalState structure
const initialState = {
  // A. Current diagram
  diagram: {
    jsonStructure: { nodes: [], edges: [] },
    mermaidSyntax: '',
  },

  // B. Current view
  view: {
    zoomLevel: 1.0,
    panX: 0,
    panY: 0,
    isFullscreen: false,
    isLoading: false,
    coloringMode: 'type',
  },
  // C. AI Chat log
  chat: {
    log: [], // Array of { role, text, type, diagramData, viewSettings, ... }
    currentInput: '',
  },
};

type DiagramState = typeof initialState;
type DiagramAction =
  | { type: 'set_chatInput'; payload: string }
  | { type: 'send_chatInput' }
  | { type: 'load_newDiagram'; payload: any };

//reducer functions
function chatReducer(state: DiagramState, action: DiagramAction) {
  switch (action.type) {
    //update user input while typing
    case 'set_chatInput': {
      return {
        ...state,
        //code here
      };
    }
    //push current diagram in log, push user input
    case 'send_chatInput': {
      return {};
    }
    //update current state with new diagram data
    case 'load_newDiagram': {
      return {};
    }
  }
}

//context
export const DiagramContext = createContext(null);
export const DiagramDispatchContext = createContext(null);

//provider

export function DiagramProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  return (
    <DiagramContext value={state}>
      <DiagramDispatchContext value={dispatch}>
        {children}
      </DiagramDispatchContext>
    </DiagramContext>
  );
}
