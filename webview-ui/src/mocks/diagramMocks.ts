import type { AiPayload } from '../types/ipcTypes';

export const simpleDiagramMock: AiPayload = {
  type: 'DIAGRAM' as const,
  message: 'Simple mock diagram',
  data: {
    mermaidSyntax: `graph TD;
      A-->B;`,
    jsonStructure: {
      nodes: [
        { id: 'A', label: 'A', type: 'FILE', path: 'A.ts' },
        { id: 'B', label: 'B', type: 'FOLDER', path: 'components/' },
      ],
      edges: [{ source: 'A', target: 'B' }],
    },
  },
} as const;
