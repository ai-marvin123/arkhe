import { WrapperType } from "./schema";

export async function generateAIResponse(prompt: string): Promise<WrapperType> {
  // Very simple logic for MVP:
  if (!prompt || prompt.trim().length < 10) {
    // Not enough info -> TEXT response
    return {
      type: "TEXT",
      message:
        "I need more details to generate a diagram. Please describe the main components and how they connect.",
    };
  }

  // Enough info -> DIAGRAM response with dummy data
  return {
    type: "DIAGRAM",
    message: "New blueprint generated with two nodes.",
    data: {
      mermaidSyntax:
        "graph TD;\n  app-file(App.js)-->src-dir(src/components);",
      jsonStructure: {
        nodes: [
          {
            id: "app-file",
            label: "App.js",
            level: 1,
            isFolder: false,
            path: "src/App.js",
          },
          {
            id: "src-dir",
            label: "src/components",
            level: 2,
            isFolder: true,
            path: "src/components",
          },
        ],
        edges: [{ source: "app-file", target: "src-dir" }],
      },
    },
  };
}