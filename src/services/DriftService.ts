// src/services/DriftService.ts

import { StructureNode, DiagramData } from '../types';
import { generateMermaidFromJSON } from '../utils/mermaidGenerator';

export interface DriftResult {
  matched: StructureNode[];
  missing: StructureNode[];
  untracked: StructureNode[];
}

export class DriftService {
  /**
   * Compare plan nodes vs actual disk nodes.
   * IDs MUST be relative paths for accurate comparison.
   */
  static calculateDrift(
    planNodes: StructureNode[],
    actualNodes: StructureNode[]
  ): DriftResult {
    // Normalize paths defensively (handle Windows backslashes)
    const normalize = (id: string) => id.replace(/\\/g, '/');

    const planMap = new Map<string, StructureNode>();
    const actualMap = new Map<string, StructureNode>();

    for (const node of planNodes) {
      planMap.set(normalize(node.id), node);
    }

    for (const node of actualNodes) {
      actualMap.set(normalize(node.id), node);
    }

    const matched: StructureNode[] = [];
    const missing: StructureNode[] = [];
    const untracked: StructureNode[] = [];

    // 1. Check Plan items against Actual
    for (const [id, planNode] of planMap.entries()) {
      if (actualMap.has(id)) {
        matched.push({ ...planNode, status: 'MATCHED' });
      } else {
        missing.push({ ...planNode, status: 'MISSING' });
      }
    }

    // 2. Check Actual items against Plan
    for (const [id, actualNode] of actualMap.entries()) {
      if (!planMap.has(id)) {
        untracked.push({ ...actualNode, status: 'UNTRACKED' });
      }
    }

    return { matched, missing, untracked };
  }

  /**
   * Helper to convert node lists back into full DiagramData format
   * using the centralized mermaid generator.
   */
  static generateDiagramData(
    nodes: StructureNode[],
    edges: { source: string; target: string }[] = []
  ): DiagramData {
    const jsonStructure = {
      nodes,
      edges,
    };

    // Use the utility to generate consistent, styled Mermaid syntax
    const mermaidSyntax = generateMermaidFromJSON(jsonStructure);

    return {
      mermaidSyntax,
      jsonStructure,
    };
  }
}
