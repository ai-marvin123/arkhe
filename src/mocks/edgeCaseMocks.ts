export const missingNodeTypeMock = {
  type: 'DIAGRAM',
  message: 'Diagram with missing node type',
  data: {
    mermaidSyntax: 'graph TD; X-->Y;',
    jsonStructure: {
      nodes: [
        {
          id: 'X',
          label: 'X',
          level: 1,
          path: 'X.ts',
          // ❌ type missing on purpose
        },
      ],
      edges: [{ source: 'X', target: 'Y' }],
    },
  },
};

export const emptyStructureMock = {
  type: 'DIAGRAM',
  message: 'Empty jsonStructure',
  data: {
    mermaidSyntax: '',
    jsonStructure: {
      nodes: [],
      edges: [],
    },
  },
};
