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
   * Compares the planned architecture (nodes from .repoplan.json)
   * against the actual file system nodes.
   * * It categorizes nodes into three groups:
   * - MATCHED: Exists in both Plan and Disk.
   * - MISSING: Exists in Plan but NOT on Disk.
   * - UNTRACKED: Exists on Disk but NOT in Plan.
   */
  static calculateDrift(
    planNodes: StructureNode[],
    actualNodes: StructureNode[]
  ): DriftResult {
    // Helper to normalize IDs for comparison.
    // We convert to lowercase to handle case-insensitive file systems (Windows/macOS) correctly.
    // This ensures "User.ts" and "user.ts" are treated as the same file.
    const normalize = (path: string) => path.replace(/\\/g, '/').toLowerCase();

    const planMap = new Map<string, StructureNode>();
    const actualMap = new Map<string, StructureNode>();

    // Index plan nodes by normalized ID
    for (const node of planNodes) {
      planMap.set(normalize(node.path), node);
    }

    // Index actual nodes by normalized ID
    for (const node of actualNodes) {
      actualMap.set(normalize(node.path), node);
    }

    const matched: StructureNode[] = [];
    const missing: StructureNode[] = [];
    const untracked: StructureNode[] = [];

    // 1. Check PLAN items against ACTUAL (Detect Matches & Missing)
    for (const [key, planNode] of planMap.entries()) {
      if (actualMap.has(key)) {
        const actualNode = actualMap.get(key)!;

        // FOUND MATCH:
        // We prioritize 'actualNode' properties (label, casing, path)
        // to ensure the diagram reflects the reality of the disk.
        // We keep 'planNode' properties just in case we need metadata from the plan.
        matched.push({
          ...planNode, // Base: Plan data
          ...actualNode, // Overlay: Actual disk data (Wins on conflict)
          status: 'MATCHED',
        });
      } else {
        // NO MATCH ON DISK -> MISSING
        missing.push({ ...planNode, status: 'MISSING' });
      }
    }

    // 2. Check ACTUAL items against PLAN (Detect Untracked)
    for (const [key, actualNode] of actualMap.entries()) {
      if (!planMap.has(key)) {
        // EXISTS ON DISK BUT NOT IN PLAN -> UNTRACKED
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
