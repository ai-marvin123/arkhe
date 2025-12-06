import type { AiResponsePayload } from '../types';

export const simpleDiagramMock: AiResponsePayload = {
  type: 'DIAGRAM' as const,
  message: 'Simple mock diagram',
  data: {
    mermaidSyntax: `graph TD;
      A-->B;`,
    jsonStructure: {
      nodes: [
        { id: 'A', label: 'A', type: 'FILE', level: 1, path: 'A.ts' },
        { id: 'B', label: 'B', type: 'FOLDER', level: 2, path: 'components/' },
      ],
      edges: [{ source: 'A', target: 'B' }],
    },
  },
};
