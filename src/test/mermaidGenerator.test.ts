import { generateMermaidFromJSON } from '../utils/mermaidGenerator';

describe('generateMermaidFromJSON', () => {
  it('returns a Mermaid string containing graph TD;', () => {
    const jsonStructure = {
      nodes: [{ id: 'A', label: 'A' }],
      edges: [],
    };

    const result = generateMermaidFromJSON(jsonStructure as any);

    expect(result).toContain('graph TD;');
  });
});
