import { describe, test, expect, vi } from 'vitest';
import { chatReducer } from '../state/diagramReducer';
import { simpleDiagramMock } from '../../../src/mocks/diagramMocks';
import { simpleChatMock } from '../../../src/mocks/chatMocks';
import { mockInitialState } from '../../../src/mocks/mockInitialState';
import { mockUserInputFE } from '../../../src/mocks/mockUserInput';
import type { DiagramData, TextEntry } from '../state/diagramTypes';

type JsonStructureType = DiagramData['jsonStructure'];

const generateId = vi.fn();
generateId
  .mockReturnValueOnce('ID-001')
  .mockReturnValueOnce('ID-002')
  .mockReturnValue('ID-NEW');

vi.mock('../utils/mermaidGenerator', () => ({
  applyMermaidStyling: (_json: JsonStructureType, raw: string) =>
    `STYLED::${raw}`,
}));

// Mock the ID generator module
vi.mock('../../utils/idGenerator', () => ({
  generateId: generateId,
}));

const FIRST_DIAGRAM_ID = 'D-001';
const diagramPayloadData = simpleDiagramMock.data;
const validDiagramData = diagramPayloadData!;
const mockTextData = simpleChatMock;
const mockUserPrompt = mockUserInputFE;

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
    generateId.mockReturnValueOnce(FIRST_DIAGRAM_ID);

    const action = {
      type: 'load_newDiagram' as const,
      payload: {
        message: simpleDiagramMock.message,
        data: validDiagramData,
      },
    };

    const stateAfter = chatReducer(mockInitialState, action);

    // 1. Content Check: Should receive styled syntax
    expect(stateAfter.diagram.mermaidSyntax).toContain('STYLED::');

    // 2. View Reset Check
    expect(stateAfter.view.zoomLevel).toBe(1.0);

    // 3. Status/Tracking Check
    expect(stateAfter.view.isLoading).toBe(false);

    // 4. Log Check: Should add one entry
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

    // 1. Log Content Check: Should add the user's text
    expect(stateAfter.chat.log.length).toBe(1);
    expect(stateAfter.chat.log[0].type).toBe('TEXT_INPUT');

    // 2. State/Status Checks
    expect(stateAfter.view.isLoading).toBe(true);
    expect(stateAfter.chat.currentInput).toBe('');
  });
});

describe('load_textOnly function', () => {
  test('should log text response, clear loading, and preserve diagram content', () => {
    const stateBeforeLoad = {
      ...mockInitialState,
      // Simulate having an active diagram that should NOT be overwritten
      diagram: {
        jsonStructure: {
          nodes: [
            {
              id: 'X',
              label: 'Old',
              // FIX: Must include the missing properties to match the Node interface
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

    // ACT
    const stateAfter = chatReducer(stateBeforeLoad, action);

    // ASSERTIONS

    // 1. Content Preservation Check: Diagram must be the same object reference
    expect(stateAfter.diagram.mermaidSyntax).toBe(
      stateBeforeLoad.diagram.mermaidSyntax
    );
    expect(stateAfter.diagram.jsonStructure.nodes.length).toBe(1); // Still has the 'Old' node

    // 2. Status Check
    expect(stateAfter.view.isLoading).toBe(false);
    expect(stateAfter.view.lastLLMMessage).toBe(mockTextData.message);

    // 3. Log Check: Should add one text entry
    expect(stateAfter.chat.log.length).toBe(1);
    const logEntry = stateAfter.chat.log[0];
    expect(logEntry.type).toBe('TEXT_RESPONSE');
    expect(logEntry.text).toBe(mockTextData.message);
  });
});
