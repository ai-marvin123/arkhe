// Must run before other imports: stub the vscode module to our mock
const Module = require("module");
const realLoad = Module._load;
Module._load = function (request: string, parent: any, isMain: boolean) {
  if (request === "vscode") {
    return require("./vscode.mock");
  }
  return realLoad(request, parent, isMain);
};

import { CommandHandler } from "../handlers/CommandHandler";

const fakePanel = {
  webview: {
    postMessage: (data: any) =>
      console.log("[mock] FRONTEND RECEIVED:", JSON.stringify(data, null, 2)),
  },
};

const mockFileService = {
  saveDiagram: async () => {
    console.log("[mock] save called");
    return true;
  },
  loadDiagram: async () => ({
    mermaidSyntax: "",
    jsonStructure: { nodes: [], edges: [] },
  }),
};

async function runTest() {
  const handler = new CommandHandler(fakePanel as any, mockFileService as any);

  console.log("\nTEST 1: SAVE_DIAGRAM");
  await handler.handle({
    command: "SAVE_DIAGRAM",
    payload: {
      sessionId: "sess-001",
      diagramData: { mermaidSyntax: "", jsonStructure: { nodes: [], edges: [] } },
    },
  });

  console.log("\nTEST 2: LOAD_DIAGRAM");
  await handler.handle({
    command: "LOAD_DIAGRAM",
    payload: { sessionId: "sess-001" },
  });
}

runTest();
