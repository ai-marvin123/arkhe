import { describe, test, expect, vi } from 'vitest';
import { chatReducer } from '../../state/diagramReducer';
import { simpleDiagramMock } from '../../mocks/diagramMocks';
import { simpleChatMock } from '../../mocks/chatMocks';
import { mockInitialState } from '../../mocks/mockInitialState';
import { mockUserInputFE } from '../../mocks/mockUserInput';
import type {
  TextEntry,
  DiagramData,
  DiagramEntry,
} from '../../types/diagramTypes';
import type { AiPayload } from '../../types/ipcTypes';
import { generateId } from '../../shared/utils/idgenerator';

type JsonStructureType = DiagramData['jsonStructure'];
vi.mock('../../shared/utils/idgenerator', () => ({
  generateId: vi.fn(),
}));

vi.mock('../../features/diagram/mermaidGenerator', () => ({
  applyMermaidStyling: (_json: JsonStructureType, raw: string) =>
    `STYLED::${raw}`,
}));

// const mockGenerateId = vi.fn();

// vi.mock('../../shared/utils/idgenerator', () => ({
//   generateId: mockGenerateId,
// }));

// mockGenerateId
//   .mockReturnValueOnce('ID-001')
//   .mockReturnValueOnce('ID-002')
//   .mockReturnValue('ID-NEW');

// vi.mock('../../features/diagram/mermaidGenerator', () => ({
//   applyMermaidStyling: (_json: JsonStructureType, raw: string) =>
//     `STYLED::${raw}`,
// }));

const FIRST_DIAGRAM_ID = 'D-001';
const mockDiagram = simpleDiagramMock as AiPayload;
const validDiagramData = mockDiagram.data!;
const mockTextData = simpleChatMock;
const mockUserPrompt = mockUserInputFE;

describe('initialize_session function', () => {
  test('should set the sessionId and preserve the existing state structure', () => {
    const action = {
      type: 'initialize_session' as const,
      payload: { sessionId: 'SESS-999' },
    };

    const stateAfter = chatReducer(mockInitialState, action);

    expect(stateAfter.session.sessionId).toBe('SESS-999');
    expect(stateAfter.chat).toEqual(mockInitialState.chat);
    expect(stateAfter.view).toEqual(mockInitialState.view);
  });
});

describe('enable_chat function', () => {
  test('should enable chat while preserving other view states', () => {
    const stateBefore = {
      ...mockInitialState,
      view: {
        ...mockInitialState.view,
        isChatEnabled: false,
        zoomLevel: 2.0,
      },
    };

    const action = { type: 'enable_chat' as const };
    const stateAfter = chatReducer(stateBefore, action);

    expect(stateAfter.view.isChatEnabled).toBe(true);
    expect(stateAfter.view.zoomLevel).toBe(2.0);
  });
});

describe('show_starterOptions function', () => {
  test('should enable the starter options overlay while preserving other view states', () => {
    const stateBefore = {
      ...mockInitialState,
      view: {
        ...mockInitialState.view,
        showStarterOptions: false,
        zoomLevel: 1.5,
      },
    };

    const action = { type: 'show_starterOptions' as const };
    const stateAfter = chatReducer(stateBefore, action);

    expect(stateAfter.view.showStarterOptions).toBe(true);
    expect(stateAfter.view.zoomLevel).toBe(1.5);

    expect(stateAfter.chat.log).toBe(stateBefore.chat.log);
  });
});

describe('send_starterOption function', () => {
  test('should close options, set loading, and add the chosen option to the log', () => {
    const OPTION_ID = 'OPT-123';
    vi.mocked(generateId).mockReturnValueOnce(OPTION_ID);

    const chosenOption = 'Generate a data flow map';
    const stateBefore = {
      ...mockInitialState,
      view: {
        ...mockInitialState.view,
        showStarterOptions: true,
        isLoading: false,
      },
      chat: { ...mockInitialState.chat, log: [] },
    };

    const action = {
      type: 'send_starterOption' as const,
      payload: chosenOption,
    };

    const stateAfter = chatReducer(stateBefore, action);
    expect(stateAfter.view.showStarterOptions).toBe(false);
    expect(stateAfter.view.isLoading).toBe(true);
    expect(stateAfter.chat.log.length).toBe(1);

    const logEntry = stateAfter.chat.log[0];
    expect(logEntry).toMatchObject({
      id: OPTION_ID,
      role: 'user',
      type: 'TEXT_INPUT',
      text: chosenOption,
    });

    expect(logEntry.timestamp).toBeGreaterThan(0);
  });
});

describe('set_userInput function', () => {
  test('should update currentInput while leaving chat log and diagram content unchanged', () => {
    const existingLogEntry: TextEntry = {
      id: 'L1',
      role: 'user' as const,
      type: 'TEXT_INPUT' as const,
      text: 'V1',
      timestamp: Date.now(),
    };
    const stateBeforeType = {
      ...mockInitialState,
      chat: {
        ...mockInitialState.chat,
        log: [existingLogEntry],
        currentInput: 'hel',
      },
    };
    const action = { type: 'set_userInput' as const, payload: 'hello' };

    const stateAfter = chatReducer(stateBeforeType, action);

    // 1. Input Check: Verify the input field updated
    expect(stateAfter.chat.currentInput).toBe('hello');

    // 2. Immutability Check: Log history must be the same length and content
    expect(stateAfter.chat.log.length).toBe(1);
    expect(stateAfter.chat.log[0].text).toBe('V1');

    // 3. Immutability Check: Diagram content must be the same
    expect(stateAfter.diagram).toBe(stateBeforeType.diagram);
  });
});

describe('load_newDiagram function', () => {
  test('should update state with styled content and reset view properties', () => {
    vi.mocked(generateId).mockReturnValueOnce(FIRST_DIAGRAM_ID);

    const action = {
      type: 'load_newDiagram' as const,
      payload: {
        message: simpleDiagramMock.message,
        data: validDiagramData,
      },
    };

    const stateAfter = chatReducer(mockInitialState, action);
    expect(stateAfter.diagram.mermaidSyntax).toContain('STYLED::');
    expect(stateAfter.view.zoomLevel).toBe(1.0);
    expect(stateAfter.view.isLoading).toBe(false);
    expect(stateAfter.chat.log.length).toBe(1);

    const firstLogEntry = stateAfter.chat.log[0];
    if (firstLogEntry.type === 'DIAGRAM_CONTENT') {
      expect(firstLogEntry.viewSettings.zoomLevel).toBe(1.0);
    } else {
      expect(firstLogEntry.type).toBe('DIAGRAM_CONTENT');
    }
  });
});

describe('send_userInput function', () => {
  test('should log user input and start loading', () => {
    const stateBeforeSubmit = {
      ...mockInitialState,
      view: { ...mockInitialState.view, activeEntryId: FIRST_DIAGRAM_ID },
      chat: { ...mockInitialState.chat, currentInput: mockUserPrompt, log: [] },
    };
    const action = { type: 'send_userInput' as const };

    const stateAfter = chatReducer(stateBeforeSubmit, action);

    expect(stateAfter.chat.log.length).toBe(1);
    expect(stateAfter.chat.log[0].type).toBe('TEXT_INPUT');
    expect(stateAfter.view.isLoading).toBe(true);
    expect(stateAfter.chat.currentInput).toBe('');
  });
});

describe('load_textOnly function', () => {
  test('should log text response, clear loading, and preserve diagram content', () => {
    const stateBeforeLoad = {
      ...mockInitialState,
      diagram: {
        jsonStructure: {
          nodes: [
            {
              id: 'X',
              label: 'Old',
              type: 'FILE' as const,
              level: 1,
              path: 'old/file.js',
            },
          ],
          edges: [],
        },
        mermaidSyntax: 'graph TD; X[Old];',
      },
      view: { ...mockInitialState.view, isLoading: true },
      chat: { ...mockInitialState.chat, log: [], currentInput: '' },
    };

    const action = { type: 'load_textOnly' as const, payload: mockTextData };
    const stateAfter = chatReducer(stateBeforeLoad, action);
    expect(stateAfter.diagram.mermaidSyntax).toBe(
      stateBeforeLoad.diagram.mermaidSyntax
    );
    expect(stateAfter.diagram.jsonStructure.nodes.length).toBe(1);
    expect(stateAfter.view.isLoading).toBe(false);
    expect(stateAfter.view.lastLLMMessage).toBe(mockTextData.message);
    expect(stateAfter.chat.log.length).toBe(1);
    const logEntry = stateAfter.chat.log[0];
    expect(logEntry.type).toBe('TEXT_RESPONSE');
    expect(logEntry.text).toBe(mockTextData.message);
  });
});

describe('update_logEntry function', () => {
  test('updates view of selected diagram', () => {
    const existingLogEntry: DiagramEntry = {
      id: 'L1',
      role: 'assistant' as const,
      type: 'DIAGRAM_CONTENT' as const,
      text: 'V1',
      diagramData: {
        jsonStructure: validDiagramData!.jsonStructure,
        mermaidSyntax: validDiagramData!.mermaidSyntax,
      },
      viewSettings: { ...mockInitialState.view },
      contentRefId: null,
      timestamp: Date.now(),
    };

    const stateBeforeUpdate = {
      ...mockInitialState,
      chat: { ...mockInitialState.chat, log: [existingLogEntry] },
    };

    const viewPayload = {
      id: 'L1',
      zoomLevel: 2.0,
      panX: 1,
      panY: 1,
      isFullscreen: true,
      isLoading: false,
      showStarterOptions: false,
      isPanActive: true,
      isChatEnabled: true,
      lastLLMMessage: '',
      isAIOpen: true,
      driftCheckStep: 'IDLE',
    };

    const action = {
      type: 'update_logEntry' as const,
      payload: { ...viewPayload },
    };

    const stateAfter = chatReducer(stateBeforeUpdate, action);
    const updatedEntry = stateAfter.chat.log.find(
      (e: DiagramEntry | TextEntry) => e.id === 'L1'
    ) as DiagramEntry;
    expect(updatedEntry.viewSettings.zoomLevel).toBe(2.0);
    expect(updatedEntry.viewSettings.panX).toBe(1);
    expect(updatedEntry.viewSettings.panY).toBe(1);
    expect(updatedEntry.viewSettings.isFullscreen).toBe(true);
    expect(updatedEntry.viewSettings.isPanActive).toBe(true);
    expect(updatedEntry.viewSettings.isAIOpen).toBe(true);
    expect(updatedEntry.viewSettings.isChatEnabled).toBe(true);
  });
});

describe('proceed_guidedFlow function', () => {
  test('should append AI response with options and advance the flow step', () => {
    const MOCK_AI_ID = 'AI-STEP-2';
    vi.mocked(generateId).mockReturnValueOnce(MOCK_AI_ID);

    const mockOptions = [
      { text: 'Yes, run a check', action: 'RUN_CHECK' as const },
      { text: 'No, I want to edit my diagram', action: 'EDIT_EXIT' as const },
    ];

    const stateBefore = {
      ...mockInitialState,
      view: {
        ...mockInitialState.view,
        driftCheckStep: 'IDLE',
      },
      chat: { ...mockInitialState.chat, log: [] },
    };

    const action = {
      type: 'proceed_guidedFlow' as const,
      payload: {
        aiScriptText: 'Would you like to check for repo alignment?',
        nextStep: 'ASK_FOR_DRIFT_CHECK',
        options: mockOptions,
      },
    };

    const stateAfter = chatReducer(stateBefore, action);
    expect(stateAfter.view.driftCheckStep).toBe('ASK_FOR_DRIFT_CHECK');

    expect(stateAfter.chat.log.length).toBe(1);
    const logEntry = stateAfter.chat.log[0];

    expect(logEntry).toMatchObject({
      id: MOCK_AI_ID,
      role: 'assistant',
      type: 'TEXT_RESPONSE',
      text: 'Would you like to check for repo alignment?',
      options: mockOptions,
    });
  });

  test('should default to empty options if none are provided in payload', () => {
    const action = {
      type: 'proceed_guidedFlow' as const,
      payload: {
        aiScriptText: 'Final step reached.',
        nextStep: 'IDLE',
        options: [],
      },
    };

    const stateAfter = chatReducer(mockInitialState, action);
    const lastEntry = stateAfter.chat.log[
      stateAfter.chat.log.length - 1
    ] as TextEntry;

    expect(lastEntry.options).toHaveLength(0);
    expect(lastEntry.options).toEqual([]);
  });
});

describe('log_userChoice function', () => {
  test('should strip options from the selected AI message and append the user choice', () => {
    const USER_MSG_ID = 'USER-CHOICE-999';
    const TARGET_AI_ID = 'AI-LOG-123';
    vi.mocked(generateId).mockReturnValueOnce(USER_MSG_ID);

    const stateWithButtons = {
      ...mockInitialState,
      chat: {
        ...mockInitialState.chat,
        log: [
          {
            id: TARGET_AI_ID,
            role: 'assistant' as const,
            type: 'TEXT_RESPONSE' as const,
            text: 'Would you like to sync?',
            options: [
              { text: 'Yes, sync it', action: 'SYNC_TO_ACTUAL' as const },
            ],
            timestamp: Date.now(),
          },
        ],
      },
    };

    const action = {
      type: 'log_userChoice' as const,
      payload: {
        logEntryId: TARGET_AI_ID,
        chosenText: 'Yes, sync it',
      },
    };

    const stateAfter = chatReducer(stateWithButtons, action);
    const updatedAiEntry = stateAfter.chat.log.find(
      (e) => e.id === TARGET_AI_ID
    ) as TextEntry;
    expect(updatedAiEntry).not.toHaveProperty('options');
    expect(stateAfter.chat.log.length).toBe(2);
    const lastEntry = stateAfter.chat.log[
      stateAfter.chat.log.length - 1
    ] as TextEntry;
    expect(lastEntry.id).toBe(USER_MSG_ID);
    expect(lastEntry.text).toBe('Yes, sync it');
    expect(lastEntry.role).toBe('user');
  });
});
