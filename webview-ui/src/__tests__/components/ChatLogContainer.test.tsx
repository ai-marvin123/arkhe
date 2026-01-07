import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import ChatLogContainer from '../../features/chat/ChatLogContainer';
import { DiagramContext, DiagramDispatchContext } from '../../state/diagramContext';
import type { DiagramState } from '../../types/diagramTypes';

/* ----------------------- MOCKS ----------------------- */

vi.mock('../../features/drift/guidedFlow', () => ({
  startDriftCheck: vi.fn(),
  executeSyncAction: vi.fn(),
}));

vi.mock('../../features/start/starterOptions', () => ({
  STARTER_OPTIONS: [
    { id: 'one', label: 'Option One', icon: 'a', prompt: 'Prompt one' },
    { id: 'two', label: 'Option Two', icon: 'b', prompt: 'Prompt two' },
  ],
  createStarterAction: vi.fn(),
}));

vi.mock('../../features/diagram/DiagramFrame', () => ({
  __esModule: true,
  default: () => <div data-testid="diagram-frame">Diagram Frame</div>,
}));

vi.mock('../../features/chat/AiMessageAccordion', () => ({
  __esModule: true,
  default: () => <div data-testid="accordion">Accordion</div>,
}));

/* ----------------------- HELPERS ----------------------- */

function renderWithProviders(
  ui: ReactElement,
  state: DiagramState,
  dispatch = vi.fn()
) {
  return render(
    <DiagramContext.Provider value={state}>
      <DiagramDispatchContext.Provider value={dispatch}>
        {ui}
      </DiagramDispatchContext.Provider>
    </DiagramContext.Provider>
  );
}

const baseView = {
  zoomLevel: 1,
  panX: 0,
  panY: 0,
  isFullscreen: false,
  isLoading: false,
  showStarterOptions: false,
  isPanActive: false,
  isChatEnabled: true,
  lastLLMMessage: '',
  isAIOpen: false,
  driftCheckStep: 'IDLE',
} as const;

/* ----------------------- TESTS ----------------------- */

describe('ChatLogContainer', () => {
  it('shows the starter prompt and options when starter choices are visible', () => {
    const starterState: DiagramState = {
      session: { sessionId: 'session-1' },
      diagram: { jsonStructure: { nodes: [], edges: [] }, mermaidSyntax: '' },
      view: { ...baseView, showStarterOptions: true },
      chat: { currentInput: '', log: [] },
    };

    renderWithProviders(<ChatLogContainer />, starterState);

    screen.getByText(
      /Select from below to get started, or type your own prompt/i
    );
    screen.getByText('Option One');
    screen.getByText('Option Two');
  });

  it('renders a diagram frame when the chat log contains diagram content', () => {
    const diagramState: DiagramState = {
      session: { sessionId: 'session-2' },
      diagram: { jsonStructure: { nodes: [], edges: [] }, mermaidSyntax: '' },
      view: { ...baseView, showStarterOptions: false },
      chat: {
        currentInput: '',
        log: [
          {
            id: 'log-1',
            role: 'assistant',
            type: 'DIAGRAM_CONTENT' as const,
            text: 'Here is your diagram',
            diagramData: {
              mermaidSyntax: 'graph TD;A-->B;',
              jsonStructure: {
                nodes: [
                  {
                    id: 'A',
                    label: 'A',
                    type: 'FILE',
                    level: 0,
                    path: 'src/A.ts',
                  },
                ],
                edges: [],
              },
            },
            viewSettings: {
              ...baseView,
              isChatEnabled: true,
            },
            contentRefId: null,
            timestamp: Date.now(),
          },
        ],
      },
    };

    renderWithProviders(<ChatLogContainer />, diagramState);

    expect(screen.getByTestId('diagram-frame')).toBeTruthy();
    expect(screen.getByTestId('accordion')).toBeTruthy();
  });
});
