import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DiagramFrame from '../../features/diagram/DiagramFrame';
import type { DiagramEntry } from '../../types/diagramTypes';

/* ----------------------- MOCKS ----------------------- */

vi.mock('../../features/diagram/MermaidRenderer', () => ({
  __esModule: true,
  default: ({ logKey }: { logKey: string }) => (
    <div data-testid='mermaid-renderer'>Mermaid diagram {logKey}</div>
  ),
}));

vi.mock('../../features/diagram/ViewTools', () => ({
  __esModule: true,
  default: () => <div data-testid='view-tools'>View tools</div>,
}));

vi.mock('../../features/diagram/viewButtons/SaveButton', () => ({
  __esModule: true,
  default: ({ status }: { status: string }) => (
    <button type='button' aria-label={status}>
      Save
    </button>
  ),
}));

vi.mock('../../shared/utils/vsCodeApi', () => ({
  postDiagramToSave: vi.fn(async () => ({
    command: 'AI_RESPONSE',
    payload: { type: 'DIAGRAM_SAVED' },
  })),
}));

/* ----------------------- TEST DATA ----------------------- */

const viewSettings = {
  zoomLevel: 1,
  panX: 0,
  panY: 0,
  isChatEnabled: true,
  isFullscreen: false,
  showStarterOptions: false,
  isLoading: false,
  isPanActive: false,
  lastLLMMessage: '',
  isAIOpen: false,
  driftCheckStep: 'IDLE',
} as const;

/* ----------------------- TESTS ----------------------- */

describe('DiagramFrame', () => {
  it('renders the mermaid diagram inside the frame along with controls', () => {
    const entry: DiagramEntry = {
      id: 'diagram-entry',
      role: 'assistant',
      type: 'DIAGRAM_CONTENT' as const,
      text: 'Generated diagram',
      diagramData: {
        mermaidSyntax: 'graph TD;A-->B;',
        jsonStructure: {
          nodes: [
            {
              id: 'A',
              label: 'A',
              type: 'FILE',
              path: 'src/A.ts',
            },
          ],
          edges: [{ source: 'A', target: 'B' }],
        },
      },
      viewSettings,
      contentRefId: null,
      timestamp: Date.now(),
    };

    render(<DiagramFrame sessionId='session-1' logKey='log-1' entry={entry} />);

    expect(screen.getByTestId('mermaid-renderer')).toBeTruthy();
    expect(screen.getByRole('button', { name: /idle/i })).toBeTruthy();
    expect(screen.getByTestId('view-tools')).toBeTruthy();
  });
});
