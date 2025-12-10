// Must run before other imports: stub the vscode module to our mock

const Module = require('module');
const realLoad = Module._load;
Module._load = function (request: string, parent: any, isMain: boolean) {
  if (request === 'vscode') {
    return require('./vscode.mock');
  }
  return realLoad(request, parent, isMain);
};

import { CommandHandler } from '../handlers/CommandHandler';
import { FileService } from '../services/FileService';

// 1. Mock the Frontend (Webview)
const fakePanel = {
  webview: {
    postMessage: (data: any) =>
      console.log(
        '[mock] 🟢 FRONTEND RECEIVED:',
        JSON.stringify(data, null, 2)
      ),
  },
};

// 2. Mock the FileService
// Since we inject this into CommandHandler, we can define how it behaves here
const mockFileService = {
  saveDiagram: async (sessionId: string, diagramData: any) => {
    console.log(
      `[mock] 💾 FileService.saveDiagram called for session: ${sessionId}`
    );
    console.log(
      `[mock] Data content to save:`,
      JSON.stringify(diagramData).substring(0, 50) + '...'
    );
    return true;
  },

  loadDiagram: async (sessionId: string) => {
    console.log(
      `[mock] 📂 FileService.loadDiagram called for session: ${sessionId}`
    );
    // Return a dummy full DiagramData object
    return {
      mermaidSyntax: 'graph TD; A[MockNode]-->B[TestNode];',
      jsonStructure: {
        nodes: [{ id: 'A', label: 'MockNode' }],
        edges: [],
      },
    };
  },
};

async function runTest() {
  // Inject the mock service into the handler
  const handler = new CommandHandler(fakePanel as any, FileService);

  console.log('\n--- TEST 1: SAVE_DIAGRAM ---');
  await handler.handle({
    command: 'SAVE_DIAGRAM',
    payload: {
      sessionId: 'sess-001',
      // We now pass the full DiagramData structure
      diagramData: {
        mermaidSyntax: 'graph TD; A-->B; Nam Test',
        jsonStructure: { nodes: [], edges: [] },
      },
    },
  });

  console.log('\n--- TEST 2: LOAD_DIAGRAM ---');
  await handler.handle({
    command: 'LOAD_DIAGRAM',
    payload: { sessionId: 'sess-001' },
  });
}

runTest();
