import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import AIChat from '../../features/chat/Aichat';
import { requestStructure } from '../../shared/utils/vsCodeApi';
import {
  useDiagramState,
  useDiagramDispatch,
} from '../../state/diagramContext';
import { mockInitialState } from '../../mocks/mockInitialState';
import type { DiagramState } from '../../types/diagramTypes';
vi.mock('../../shared/utils/vsCodeApi', () => ({
  requestStructure: vi.fn(),
}));

vi.mock('../../state/diagramContext', () => ({
  useDiagramState: vi.fn(),
  useDiagramDispatch: vi.fn(),
}));

describe('AIChat Component - API Response Handling', () => {
  const mockDispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDiagramDispatch).mockReturnValue(mockDispatch);
    vi.mocked(useDiagramState).mockReturnValue({
      ...mockInitialState,
      chat: {
        ...mockInitialState.chat,
        currentInput: 'Update my diagram',
      },
      view: {
        ...mockInitialState.view,
        isLoading: false,
        isChatEnabled: true,
      },
    } as DiagramState);
  });

  test('should dispatch load_newDiagram when payload type is DIAGRAM', async () => {
    const mockDiagramRes = {
      command: 'AI_RESPONSE' as const,
      payload: {
        type: 'DIAGRAM' as const,
        message: 'Success!',
        data: {
          mermaidSyntax: 'graph TD; A-->B',
          jsonStructure: { nodes: [], edges: [] },
        },
      },
    };
    vi.mocked(requestStructure).mockResolvedValue(mockDiagramRes);

    render(<AIChat />);
    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    await vi.waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'load_newDiagram',
        payload: { message: 'Success!', data: mockDiagramRes.payload.data },
      });
    });
  });

  // --- BRANCH 2: TEXT RESPONSE ---
  test('should dispatch load_textOnly when payload type is TEXT', async () => {
    const mockTextRes = {
      command: 'AI_RESPONSE' as const,
      payload: {
        type: 'TEXT' as const,
        message: 'I need more information.',
      },
    };
    vi.mocked(requestStructure).mockResolvedValue(mockTextRes);

    render(<AIChat />);
    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    await vi.waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'load_textOnly',
        payload: { message: 'I need more information.' },
      });
    });
  });

  // --- BRANCH 3: CATCH ERROR ---
  test('should dispatch load_textOnly with error message when API call fails', async () => {
    const errorMsg = 'Timeout';
    vi.mocked(requestStructure).mockRejectedValue(errorMsg);

    render(<AIChat />);
    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    await vi.waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'load_textOnly',
        payload: {
          message: `${errorMsg} API Error: Failed to connect to the backend.`,
        },
      });
    });
  });
});
