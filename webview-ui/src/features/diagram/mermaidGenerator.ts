//styling function (color by file/folder)

// import { simpleDiagramMock } from "../../../src/mocks/diagramMocks";

// src/types/diagram.ts
// console.log(simpleDiagramMock);

export interface DiagramNode {
  id: string;
  label: string;
  type: "FILE" | "FOLDER" | string;
  level: number;
  path: string;
  parentId?: string;
  status?: "MATCHED" | "MISSING" | "UNTRACKED";
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
    folder: { fill: "#3600b3", text: "#FFFFFF" },
    file: { fill: "#5d1ec4", text: "#FFFFFF" },
    missing: { fill: "#CF6679", text: "#FFFFFF" },
    untracked: {
      fill: "#5d1ec4",
      text: "#FFFFFF",
      stroke: "#BB86FC",
      strokeWidth: "2px",
    },
  };

  const classDefs = [
    "%% === NODE COLOR DEFINITIONS === %%",
    `classDef folder fill:${COLORS.folder.fill},color:${COLORS.folder.text},stroke:none,font-size:12px;`,
    `classDef file fill:${COLORS.file.fill},color:${COLORS.file.text},stroke:none,font-size:12px;`,
    `classDef missing fill:${COLORS.missing.fill},color:${COLORS.missing.text},stroke:none,font-size:12px;`,
    `classDef untracked fill:${COLORS.untracked.fill},color:${COLORS.untracked.text},stroke:${COLORS.untracked.stroke},stroke-width:${COLORS.untracked.strokeWidth},font-size:12px;`,
  ].join("\n");

  const classAssignments = jsonStructure.nodes
    .map((node) => {
      if (node.status === "MISSING") {
        return `${node.id}:::missing`;
      }
      if (node.status === "UNTRACKED") {
        return `${node.id}:::untracked`;
      }
      const className = node.type === "FOLDER" ? "folder" : "file";
      return `${node.id}:::${className}`;
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


${graphContent}


${classDefs}


${classAssignments}
`.trim();
  // --- END OF CRITICAL MERMAID SYNTAX FIX ---
}
