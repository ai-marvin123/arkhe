// ==========================================
// 1. SYSTEM MOCKING (Must be at the very top)
// ==========================================
const Module = require('module');
const originalLoad = Module._load;

function assert(condition: any, message = 'Assertion failed') {
  if (!condition){ throw new Error(`❌ ${message}`);
}
}

const mockFileService = {
  loadDiagram: async () => ({
    jsonStructure: {
      nodes: [
        { id: 'src/index.ts', name: 'index.ts', type: 'FILE', path: 'src/index.ts' },
      ],
      edges: [],
    },
  }),

  scanDirectory: async () => [],
  
  saveDiagram: async () => {},
};

// Intercept requests for 'vscode'
Module._load = function (request: string, parent: any, isMain: boolean) {
  if (request === 'vscode') {
    return {
      workspace: {},
      window: {
        showErrorMessage: (msg: string) =>
          console.error('❌ VSCODE ERROR:', msg),
        showWarningMessage: (msg: string) =>
          console.warn('⚠️ VSCODE WARN:', msg),
        showInformationMessage: (msg: string) =>
          console.log('ℹ️ VSCODE INFO:', msg),
      },
      Uri: {
        file: (f: string) => ({ fsPath: f }),
        parse: (f: string) => ({ fsPath: f }),
      },
      // Mock WebviewPanel class if needed implicitly
      WebviewPanel: class {},
    };
  }
  return originalLoad(request, parent, isMain);
};

// ==========================================
// 2. IMPORTS (Must use 'require' after mocking)
// ==========================================
const fs = require('fs');
const path = require('path');

// Import your modules AFTER mocking vscode
const { CommandHandler } = require('../handlers/CommandHandler');

// Types (Just for TS checking, removed from runtime execution)
import { MessageToBackend, MessageToFrontend } from '../types';

const fakePanel = {
  webview: {
    postMessage: (data: MessageToFrontend) => {
      // Logic log file giữ nguyên
      const outputPath = path.join(__dirname, 'backend_output.json');
      fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
      console.log(`📩 BACKEND SENT: Data saved to ${outputPath}`);

      if (data.command === 'AI_RESPONSE' && data.payload.type === 'DIAGRAM') {
        // Fix: Access correct path inside payload
        // DiagramDataSchema: { mermaidSyntax: string, jsonStructure: ... }
        const diagramData = data.payload.data;

        if (diagramData && diagramData.mermaidSyntax) {
          const mermaidPath = path.join(__dirname, 'backend_output.mmd');
          fs.writeFileSync(mermaidPath, diagramData.mermaidSyntax);
          console.log(`📩 BACKEND SENT: Data saved to ${mermaidPath}`);
          console.log('✅ Valid Diagram Structure received!');
        } else {
          console.warn('⚠️ Received DIAGRAM type but missing mermaidSyntax');
        }
      }
    },
  },
};

// --- TEST 1: HAPPY PATH (Diagram) ---
async function runTest1() {
  console.log('--- TEST 1: Happy Path (NestJS Diagram) ---');

  const msg1: MessageToBackend = {
    command: 'GENERATE_STRUCTURE',
    payload: {
      sessionId: 'test-sess-01',
      prompt: 'create a full nestjs backend folder structure',
    },
  };

  const handler = new CommandHandler(fakePanel);

  await handler.handle(msg1);
}

// --- TEST 2: CHAT ONLY (Text Response) ---
async function runTest2() {
  console.log('\n--- TEST 2: Chat Only (Text response) ---');
  const msg: MessageToBackend = {
    command: 'GENERATE_STRUCTURE',
    payload: {
      sessionId: 'sess-002',
      prompt: 'chat hello world',
    },
  };
  const handler = new CommandHandler(fakePanel);
  await handler.handle(msg);
}

// --- TEST 3: ERROR HANDLING (Malformed/Missing Type) ---
async function runTest3() {
  console.log('\n--- TEST 3: Edge Case (Error Simulation) ---');
  const msg: MessageToBackend = {
    command: 'GENERATE_STRUCTURE',
    payload: {
      sessionId: 'sess-003',
      prompt: 'generate an error please',
    },
  };
  const handler = new CommandHandler(fakePanel);
  await handler.handle(msg);
}

// --- TEST 4: EMPTY DATA BUG (AI returns empty structure) ---
async function runTest4() {
  console.log('\n--- TEST 4: Edge Case (Empty Data) ---');
  const msg: MessageToBackend = {
    command: 'GENERATE_STRUCTURE',
    payload: {
      sessionId: 'sess-004',
      prompt: 'return empty structure',
    },
  };
  const handler = new CommandHandler(fakePanel);
  await handler.handle(msg);
}

// --- TEST 5: RESET SESSION (Command Logic) ---
async function runTest5() {
  console.log('\n--- TEST 5: Reset Session Command ---');
  const msg: MessageToBackend = {
    command: 'RESET_SESSION',
    payload: {
      sessionId: 'sess-001',
    },
  };
  const handler = new CommandHandler(fakePanel);
  await handler.handle(msg);
}

async function runTest6() {
  console.log('\n=============================================');
  console.log('--- TEST 6: Conversation Chain (Refinement) ---');
  console.log('=============================================');

  const sessionId = 'chain-session-01';
  const handler = new CommandHandler(fakePanel);

  // Turn 1: Initial Request
  console.log('👤 [User Turn 1]: Create a simple React structure');
  await handler.handle({
    command: 'GENERATE_STRUCTURE',
    payload: { sessionId, prompt: 'create simple react structure' },
  });

  // Simulate user reading time
  await new Promise((r) => setTimeout(r, 500));

  // Turn 2: Follow-up (Refinement)
  console.log('👤 [User Turn 2]: Add a Redux store folder to that');
  await handler.handle({
    command: 'GENERATE_STRUCTURE',
    // The backend should use history to know "that" refers to the React structure
    payload: { sessionId, prompt: 'add redux store folder to that' },
  });
}

// --- TEST 7: PARALLEL SESSIONS ---
// Scenario: Two different users interacting simultaneously.
// Backend must not mix up their histories.
async function runTest7() {
  console.log('\n=============================================');
  console.log('--- TEST 7: Parallel Sessions (Concurrency) ---');
  console.log('=============================================');

  const handler = new CommandHandler(fakePanel);

  const taskA = (async () => {
    console.log('👤 [User A]: Requesting NestJS...');
    await handler.handle({
      command: 'GENERATE_STRUCTURE',
      payload: { sessionId: 'user-a-sess', prompt: 'nestjs structure' },
    });
  })();

  const taskB = (async () => {
    console.log('👤 [User B]: Just saying hello...');
    await handler.handle({
      command: 'GENERATE_STRUCTURE',
      payload: { sessionId: 'user-b-sess', prompt: 'chat hello' },
    });
  })();

  await Promise.all([taskA, taskB]);
  console.log('✅ Parallel requests completed.');
}

// --- TEST 8: LIFECYCLE & RESET ---
// Scenario: User generates data -> Resets session -> Verifies memory is gone.
async function runTest8() {
  console.log('\n=============================================');
  console.log('--- TEST 8: Full Lifecycle & Session Reset ---');
  console.log('=============================================');

  const sessionId = 'lifecycle-session-01';
  const handler = new CommandHandler(fakePanel);

  // 1. Build Context
  console.log('👤 [Step 1]: Generate architecture');
  await handler.handle({
    command: 'GENERATE_STRUCTURE',
    payload: { sessionId, prompt: 'python flask app structure' },
  });

  // 2. Reset Session
  // console.log('👤 [Step 2]: RESET_SESSION command');
  // await handler.handle({
  //   command: 'RESET_SESSION',
  //   payload: { sessionId },
  // });

  // 3. Verify Memory Loss
  // If memory was cleared, AI should treat this as a new conversation
  console.log('👤 [Step 3]: Ask follow-up (Should lack context)');
  await handler.handle({
    command: 'GENERATE_STRUCTURE',
    payload: { sessionId, prompt: 'chat what did I just ask you to build?' },
  });
}
async function testEmptyWorkspaceDrift() {
  const messages: any[] = [];

  const fakePanel = {
    webview: {
      postMessage: (msg: any) => messages.push(msg),
    },
  };

  const handler = new CommandHandler(fakePanel as any, mockFileService);

  await handler.handle({
    command: 'CHECK_DRIFT',
    payload: { sessionId: 'edge-test' },
  });

  assert(
  messages[0].payload.message.includes('Workspace is empty'),
  'Expected empty workspace message'
);
}

async function testAllMatched() {
  const messages: any[] = [];

  const handler = new CommandHandler(
    { webview: { postMessage: (m: any) => messages.push(m) } } as any,
    {
      loadDiagram: async () => ({
        jsonStructure: {
          nodes: [{ id: 'src/index.ts', type: 'FILE', path: 'src/index.ts' }],
          edges: [],
        },
      }),
      scanDirectory: async () => [
        { id: 'src/index.ts', type: 'FILE', path: 'src/index.ts' },
      ],
      saveDiagram: async () => {},
    }
  );

  await handler.handle({
    command: 'CHECK_DRIFT',
    payload: { sessionId: 'test' },
  });

  if (messages[0].payload.type !== 'ALL_MATCHED') {
  throw new Error('Expected ALL_MATCHED payload');
}
}

async function testMissingOnly() {
  const messages: any[] = [];

  const handler = new CommandHandler(
    { webview: { postMessage: (m: any) => messages.push(m) } } as any,
    {
      loadDiagram: async () => ({
        jsonStructure: {
          nodes: [
            // 👇 include folder in plan so it won't count as untracked
            { id: 'src', type: 'FOLDER', path: 'src' },
            { id: 'src/app.ts', type: 'FILE', path: 'src/app.ts' },
          ],
          edges: [],
        },
      }),
      scanDirectory: async () => [
        // 👇 folder exists, but file is missing
        { id: 'src', type: 'FOLDER', path: 'src' },
      ],
      saveDiagram: async () => {},
    }
  );

  await handler.handle({
    command: 'CHECK_DRIFT',
    payload: { sessionId: 'test' },
  });

  assert(messages.length === 1, 'Expected 1 message');
  assert(messages[0].payload.type === 'MISSING_DIAGRAM', 'Expected MISSING_DIAGRAM');
}

async function testUntrackedOnly() {
  const messages: any[] = [];

  const handler = new CommandHandler(
    { webview: { postMessage: (m: any) => messages.push(m) } } as any,
    {
      loadDiagram: async () => ({
        jsonStructure: { nodes: [], edges: [] },
      }),
      scanDirectory: async () => [
        { id: 'src/new.ts', type: 'FILE', path: 'src/new.ts' },
      ],
      saveDiagram: async () => {},
    }
  );

  await handler.handle({
    command: 'CHECK_DRIFT',
    payload: { sessionId: 'test' },
  });

  assert(
  messages[0].payload.type === 'UNTRACKED_DIAGRAM',
  'Expected UNTRACKED_DIAGRAM payload'
);
}

async function testMixedDrift() {
  const messages: any[] = [];

  const handler = new CommandHandler(
    { webview: { postMessage: (m: any) => messages.push(m) } } as any,
    {
      loadDiagram: async () => ({
        jsonStructure: {
          nodes: [{ id: 'src/a.ts', type: 'FILE', path: 'src/a.ts' }],
          edges: [],
        },
      }),
      scanDirectory: async () => [
        { id: 'src/b.ts', type: 'FILE', path: 'src/b.ts' },
      ],
      saveDiagram: async () => {},
    }
  );

  await handler.handle({
    command: 'CHECK_DRIFT',
    payload: { sessionId: 'test' },
  });

assert(messages.length === 2, 'Expected 2 messages');
assert(messages[0].payload.type === 'MISSING_DIAGRAM', 'Expected MISSING_DIAGRAM');
assert(messages[1].payload.type === 'UNTRACKED_DIAGRAM', 'Expected UNTRACKED_DIAGRAM');

}

// ==========================================
// MAIN RUNNER
// ==========================================
async function runAllTests() {
  // await runTest1();
  // await runTest2();
  // await runTest3();
  // await runTest4();
  // await runTest5();

  // await runTest6();
  // await runTest7();
}

async function runPhase2Tests() {
  await testEmptyWorkspaceDrift();
  await testAllMatched();
  await testMissingOnly();
  await testUntrackedOnly();
  await testMixedDrift();

  console.log('✅ All Phase 2 Drift Tests Passed');
}


runPhase2Tests();

// runAllTests();
