//styling function (color by file/folder)

import {
  MOCK_REACT_ARCH,
  MOCK_NESTJS_ARCH,
} from "../../../src/mocks/diagramMocks";

// src/types/diagram.ts
console.log(MOCK_REACT_ARCH);
console.log(MOCK_NESTJS_ARCH);

export interface DiagramNode {
  id: string;
  label: string;
  type: "FILE" | "FOLDER" | string;
  level: number;
  path: string;
  parentId?: string;
}

export interface DiagramEdge {
  source: string;
  target: string;
}

export interface JsonStructure {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export interface DiagramResponse {
  type: string;
  message: string;
  data: {
    mermaidSyntax: string;
    jsonStructure: JsonStructure;
  };
}

export function applyMermaidStyling(
  jsonStructure: JsonStructure,
  rawMermaid: string
) {
  const COLORS = {
    folder: {
      fill: "#OF2D8C",
      text: "#000000",
      stroke: "#333",
    },
    file: {
      fill: "#366EC2",
      text: "#000000",
      stroke: "#666",
    },
  };

  const classDefs = [
    "%% === NODE COLOR DEFINITIONS === %%",
    `classDef folder fill:${COLORS.folder.fill},color:${COLORS.folder.text},stroke:${COLORS.folder.stroke},stroke-width:2px;`,
    `classDef file fill:${COLORS.file.fill},color:${COLORS.file.text},stroke:${COLORS.file.stroke},stroke-width:1px;`,
  ].join("\n");

  const classAssignments = jsonStructure.nodes
    .map((node) => {
      // Ensure node.type is checked robustly (your data already uses "FOLDER" and "FILE")
      const className = node.type === "FOLDER" ? "folder" : "file";
      return `  ${node.id}:::${className};`;
    })
    .join("\n");

  // --- START OF CRITICAL MERMAID SYNTAX FIX ---

  // 1. Split the rawMermaid code into lines
  const lines = rawMermaid.trim().split("\n");

  // 2. The first line should be the graph type (e.g., 'graph TD')
  const graphDeclaration = lines[0];

  // 3. The rest of the lines are the actual nodes and edges
  const graphContent = lines.slice(1).join("\n");

  // 4. Reassemble the syntax in the correct order:
  return `
    ${graphDeclaration}
    
    %% === STYLE RULES === %%
    ${classDefs}

    %% === APPLY CLASSES PER NODE === %%
    ${classAssignments}

    ${graphContent}
  `;
  // --- END OF CRITICAL MERMAID SYNTAX FIX ---
}
