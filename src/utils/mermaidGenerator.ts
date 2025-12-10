import { JsonStructure } from '../types';

/**
 * Generates a Mermaid diagram string from a JSON structure.
 * * Logic:
 * 1. Maps all nodes to a clean label lookup.
 * 2. Iterates through edges to create connections (A --> B).
 * 3. Checks for any "orphan" nodes (nodes not involved in any edges) and adds them explicitly.
 */
export const generateMermaidFromJSON = (structure: JsonStructure): string => {
  // Return empty string if no nodes exist to avoid syntax errors
  if (!structure.nodes || structure.nodes.length === 0) {
    return '';
  }

  let mermaidString = 'graph TD;\n';
  const renderedNodeIds = new Set<string>();

  // 1. Create a map of ID -> Clean Label for easy lookup
  const nodeMap = new Map<string, string>();

  structure.nodes.forEach((node) => {
    // Sanitize label: remove parentheses or quotes to prevent Mermaid syntax errors
    const cleanLabel = node.label.replace(/["()]/g, '');
    nodeMap.set(node.id, cleanLabel);
  });

  // 2. Generate Edges: "SourceID(SourceLabel) --> TargetID(TargetLabel)"
  if (structure.edges) {
    structure.edges.forEach((edge) => {
      const sourceLabel = nodeMap.get(edge.source) || edge.source;
      const targetLabel = nodeMap.get(edge.target) || edge.target;

      // Use parentheses () to create rounded box shapes for nodes
      mermaidString += `  ${edge.source}(${sourceLabel}) --> ${edge.target}(${targetLabel});\n`;

      // Track that these nodes have been rendered
      renderedNodeIds.add(edge.source);
      renderedNodeIds.add(edge.target);
    });
  }

  // 3. Handle Orphan Nodes
  // (Nodes that exist in the list but have no edges connecting them, e.g., root files in a flat structure)
  structure.nodes.forEach((node) => {
    if (!renderedNodeIds.has(node.id)) {
      const label = nodeMap.get(node.id) || node.label;
      mermaidString += `  ${node.id}(${label});\n`;
    }
  });

  return mermaidString;
};
