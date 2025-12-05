import { WrapperType } from "../schemas/WrapperSchema";

export async function generateAIResponse(prompt: any): Promise<WrapperType> {
  // MVP fallback: not enough info
  if (!prompt || prompt.trim().length < 10) {
    return {
      type: "TEXT",
      message:
        "I need more details to generate a diagram. Please describe the main components and how they connect.",
    };
  }

  // Enough info -> DIAGRAM response
  return {
    type: "DIAGRAM",
    message: "New blueprint generated with two nodes.",
    data: {
      mermaidSyntax: `graph TD;
  app-file(App.js)-->src-dir(src/components);`,
      jsonStructure: {
        nodes: [
          {
            id: "app-file",
            label: "App.js",
            type: "FILE",      // ✅ REQUIRED
            level: 1,
            path: "src/App.js",
          },
          {
            id: "src-dir",
            label: "src/components",
            type: "FOLDER",    // ✅ REQUIRED
            level: 2,
            path: "src/components",
          },
        ],
        edges: [
          { source: "app-file", target: "src-dir" },
        ],
      },
    },
  };
}
