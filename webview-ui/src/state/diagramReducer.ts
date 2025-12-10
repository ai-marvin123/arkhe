import type { DiagramAction, DiagramState } from './diagramTypes';
import { initialState } from './initialState';
import { applyMermaidStyling } from '../utils/mermaidGenerator';
import { generateId } from '../utils/idgenerator';

//reducer functions
export function chatReducer(
  state: DiagramState,
  action: DiagramAction
): DiagramState {
  //save session ID
  switch (action.type) {
    case 'initialize_session': {
      return {
        ...state,
        session: {
          sessionId: action.payload.sessionId,
        },
      };
    }
    //enable chat if no saved diagram
    case 'enable_chat': {
      return {
        ...state,
        view: {
          ...state.view,
          isChatEnabled: true,
          isLoading: false,
        },
      };
    }
    //update user input while typing
    case 'set_userInput': {
      return {
        ...state,
        chat: {
          ...state.chat,
          currentInput: action.payload,
        },
      };
    }
    //dispatched on submit: save latest user input in log
    case 'send_userInput': {
      const archivedUserInput = {
        id: generateId(),
        role: 'user',
        type: 'TEXT_INPUT' as const,
        text: state.chat.currentInput,
        timestamp: Date.now(),
      };
      return {
        ...state,
        view: {
          ...state.view,
          isLoading: true,
        },
        chat: {
          ...state.chat,
          currentInput: '',
          log: [...state.chat.log, archivedUserInput],
        },
      };
    }

    //after receiving data from BE - update current state with new diagram data
    case 'load_newDiagram': {
      const styledMermaidSyntax = applyMermaidStyling(
        action.payload.data.jsonStructure,
        action.payload.data.mermaidSyntax
      );
      const defaultView = {
        zoomLevel: initialState.view.zoomLevel,
        panX: initialState.view.panX,
        panY: initialState.view.panY,
        isFullscreen: false,
      };
      const newDiagramId = generateId();
      const newAssistantEntry = {
        id: newDiagramId,
        role: 'assistant',
        text: action.payload.message,
        type: 'DIAGRAM_CONTENT' as const, // NEW TYPE: Signals this entry holds unique content
        diagramData: {
          jsonStructure: action.payload.data.jsonStructure,
          mermaidSyntax: styledMermaidSyntax,
        },
        viewSettings: { ...initialState.view, ...defaultView, isAIOpen: false },

        contentRefId: null,
        timestamp: Date.now(),
      };

      return {
        ...state,
        diagram: {
          jsonStructure: action.payload.data.jsonStructure,
          mermaidSyntax: styledMermaidSyntax,
        },
        view: {
          ...state.view,
          ...defaultView,
          lastLLMMessage: action.payload.message,
          isLoading: false,
        },
        chat: {
          ...state.chat,
          log: [...state.chat.log, newAssistantEntry], // Only logs the unique content entry
        },
      };
    }
    //dispatched when AI responds with message only
    case 'load_textOnly': {
      const newAssistantEntry = {
        id: generateId(),
        role: 'assistant',
        text: action.payload.message,
        type: 'TEXT_RESPONSE' as const,
        timestamp: Date.now(),
      };
      return {
        ...state,
        view: {
          ...state.view,
          isLoading: false,
          lastLLMMessage: action.payload.message,
        },
        chat: {
          ...state.chat,
          log: [...state.chat.log, newAssistantEntry],
        },
      };
    }
    //diapatched when user uses view tools in any diagram of choice: updates view
    case 'update_logEntry': {
      const { id, ...viewUpdates } = action.payload;
      const newLog = state.chat.log.map((entry) => {
        if (entry.id === id && entry.type === 'DIAGRAM_CONTENT') {
          return {
            ...entry,
            viewSettings: {
              ...entry.viewSettings,
              ...viewUpdates,
            },
          };
        }
        return entry;
      });
      return {
        ...state,
        chat: {
          ...state.chat,
          log: newLog,
        },
      };
    }
    default:
      return state;
  }
}
