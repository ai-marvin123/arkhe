// src/services/DriftService.ts

import { StructureNode, DiagramData } from "../types";

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
    // Normalize paths defensively
    const normalize = (id: string) => id.replace(/\\/g, "/");

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

    for (const [id, planNode] of planMap.entries()) {
      if (actualMap.has(id)) {
        matched.push({ ...planNode, status: "MATCHED" });
      } else {
        missing.push({ ...planNode, status: "MISSING" });
      }
    }

    for (const [id, actualNode] of actualMap.entries()) {
      if (!planMap.has(id)) {
        untracked.push({ ...actualNode, status: "UNTRACKED" });
      }
    }

    return { matched, missing, untracked };
  }

  static generateDiagramData(
    nodes: StructureNode[],
    edges: { source: string; target: string }[] = []
  ): DiagramData {
    const mermaidLines: string[] = ["graph TD"];

    for (const edge of edges) {
      mermaidLines.push(`${edge.source} --> ${edge.target}`);
    }

    return {
      mermaidSyntax: mermaidLines.join("\n"),
      jsonStructure: {
        nodes,
        edges,
      },
    };
  }
}
