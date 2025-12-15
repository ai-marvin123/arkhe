// src/test/phase2Test.ts

// ==========================================
// 1. SYSTEM MOCKING (Must be at the very top)
// ==========================================
const Module = require('module');
const originalLoad = Module._load;

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

// ==========================================
// 3. TESTS
// ==========================================

async function testEmptyWorkspaceDrift() {
  console.log('\n==================================================');
  console.log('🧪 TEST: Empty Workspace (Expected: MISSING_DIAGRAM)');
  console.log('==================================================');

  const messages: any[] = [];

  // Mock: Plan has files, but Scan returns empty []
  const handler = new CommandHandler(
    { webview: { postMessage: (m: any) => messages.push(m) } } as any,
    {
      loadDiagram: null,
      // async () => ({
      //   jsonStructure: {
      //     // ✅ FIX: Added 'label' to prevent crash
      //     nodes: [
      //       { id: 'src/a.ts', label: 'a.ts', type: 'FILE', path: 'src/a.ts' },
      //     ],
      //     edges: [],
      //   },
      // }),
      scanDirectory: async () => [], // Empty disk
      saveDiagram: async () => {},
    }
  );

  await handler.handle({
    command: 'CHECK_DRIFT',
    payload: { sessionId: 'edge-test' },
  });

  // LOG OUTPUT
  console.log(`👉 Messages Received: ${messages.length}`);
  messages.forEach((msg, idx) => {
    console.log(`   [Msg ${idx + 1}] Type:    ${msg.payload.type}`);
    // console.log(`            Message: ${msg.payload.message}`);
  });
}

async function testSyncToActual() {
  console.log('\n==================================================');
  console.log('🧪 TEST: Sync To Actual (Expected: DIAGRAM & Save Call)');
  console.log('==================================================');

  const messages: any[] = [];
  let savedData: any = null;

  const handler = new CommandHandler(
    { webview: { postMessage: (m: any) => messages.push(m) } } as any,
    {
      // Load old diagram
      loadDiagram: async () => ({
        jsonStructure: {
          // ✅ FIX: Added 'label'
          nodes: [
            {
              id: 'src/old.ts',
              label: 'old.ts',
              type: 'FILE',
              path: 'src/old.ts',
            },
          ],
          edges: [{ source: 'root', target: 'src/old.ts' }],
        },
      }),
      // Scan actual disk (new state)
      scanDirectory: async () => [
        // ✅ FIX: Added 'label'
        { id: 'src/new.ts', label: 'new.ts', type: 'FILE', path: 'src/new.ts' },
      ],
      // Capture saved data
      saveDiagram: async (_id: string, data: any) => {
        savedData = data;
        return true;
      },
    }
  );

  await handler.handle({
    command: 'SYNC_TO_ACTUAL',
    payload: { sessionId: 'sync-test' },
  });

  // LOG MESSAGES
  console.log(`👉 Messages Received: ${messages.length}`);
  messages.forEach((msg, idx) => {
    console.log(`   [Msg ${idx + 1}] Type:    ${msg.payload.type}`);
    // console.log(`            Message: ${msg.payload.message}`);
  });

  // LOG SAVED DATA
  console.log('👉 File Save Status:');
  if (savedData) {
    console.log('   ✅ FileService.saveDiagram was called.');
    console.log(
      '   💾 Saved Nodes:',
      JSON.stringify(savedData.jsonStructure.nodes, null, 2)
    );
  } else {
    console.log('   ❌ FileService.saveDiagram was NOT called.');
  }
}

async function testAllMatched() {
  console.log('\n==================================================');
  console.log('🧪 TEST: All Matched (Expected: ALL_MATCHED)');
  console.log('==================================================');

  const messages: any[] = [];

  const handler = new CommandHandler(
    { webview: { postMessage: (m: any) => messages.push(m) } } as any,
    {
      loadDiagram: async () => ({
        jsonStructure: {
          // ✅ FIX: Added 'label'
          nodes: [
            {
              id: 'src/index.ts',
              label: 'index.ts',
              type: 'FILE',
              path: 'src/index.ts',
            },
          ],
          edges: [],
        },
      }),
      scanDirectory: async () => [
        // ✅ FIX: Added 'label'
        {
          id: 'src/index.ts',
          label: 'index.ts',
          type: 'FILE',
          path: 'src/index.ts',
        },
      ],
      saveDiagram: async () => {},
    }
  );

  await handler.handle({
    command: 'CHECK_DRIFT',
    payload: { sessionId: 'test' },
  });

  // LOG OUTPUT
  messages.forEach((msg, idx) => {
    console.log(`   [Msg ${idx + 1}] Type: ${msg.payload.type}`);
  });
}

async function testMissingOnly() {
  console.log('\n==================================================');
  console.log('🧪 TEST: Missing Only (Expected: MISSING_DIAGRAM)');
  console.log('==================================================');

  const messages: any[] = [];

  const handler = new CommandHandler(
    { webview: { postMessage: (m: any) => messages.push(m) } } as any,
    {
      loadDiagram: async () => ({
        jsonStructure: {
          // ✅ FIX: Added 'label'
          nodes: [
            { id: 'src', label: 'src', type: 'FOLDER', path: 'src' },
            {
              id: 'src/app.ts',
              label: 'app.ts',
              type: 'FILE',
              path: 'src/app.ts',
            },
          ],
          edges: [],
        },
      }),
      scanDirectory: async () => [
        // 'src/app.ts' is missing from scan
        // ✅ FIX: Added 'label'
        { id: 'src', label: 'src', type: 'FOLDER', path: 'src' },
      ],
      saveDiagram: async () => {},
    }
  );

  await handler.handle({
    command: 'CHECK_DRIFT',
    payload: { sessionId: 'test' },
  });

  // LOG OUTPUT
  messages.forEach((msg, idx) => {
    console.log(`   [Msg ${idx + 1}] Type: ${msg.payload.type}`);
  });
}

async function testUntrackedOnly() {
  console.log('\n==================================================');
  console.log('🧪 TEST: Untracked Only (Expected: UNTRACKED_DIAGRAM)');
  console.log('==================================================');

  const messages: any[] = [];

  const handler = new CommandHandler(
    { webview: { postMessage: (m: any) => messages.push(m) } } as any,
    {
      loadDiagram: async () => ({
        jsonStructure: { nodes: [], edges: [] },
      }),
      scanDirectory: async () => [
        // ✅ FIX: Added 'label'
        { id: 'src/new.ts', label: 'new.ts', type: 'FILE', path: 'src/new.ts' },
      ],
      saveDiagram: async () => {},
    }
  );

  await handler.handle({
    command: 'CHECK_DRIFT',
    payload: { sessionId: 'test' },
  });

  // LOG OUTPUT
  messages.forEach((msg, idx) => {
    console.log(`   [Msg ${idx + 1}] Type: ${msg.payload.type}`);
  });
}

async function testMixedDrift() {
  console.log('\n==================================================');
  console.log(
    '🧪 TEST: Mixed Drift (Expected: MISSING_DIAGRAM then UNTRACKED_DIAGRAM)'
  );
  console.log('==================================================');

  const messages: any[] = [];

  const handler = new CommandHandler(
    { webview: { postMessage: (m: any) => messages.push(m) } } as any,
    {
      loadDiagram: async () => ({
        jsonStructure: {
          // ✅ FIX: Added 'label'
          nodes: [
            { id: 'src/a.ts', label: 'a.ts', type: 'FILE', path: 'src/a.ts' },
          ],
          edges: [],
        },
      }),
      scanDirectory: async () => [
        // ✅ FIX: Added 'label'
        { id: 'src/b.ts', label: 'b.ts', type: 'FILE', path: 'src/b.ts' },
      ],
      saveDiagram: async () => {},
    }
  );

  await handler.handle({
    command: 'CHECK_DRIFT',
    payload: { sessionId: 'test' },
  });

  // LOG OUTPUT
  console.log(`👉 Messages Received: ${messages.length}`);
  messages.forEach((msg, idx) => {
    console.log(`   [Msg ${idx + 1}] Type: ${msg.payload.type}`);
  });
}

// ==========================================
// 4. RUN ALL TESTS
// ==========================================
async function runPhase2Tests() {
  console.log('\n🚀 --- STARTING PHASE 2 VISUAL TESTS ---\n');

  try {
    await testEmptyWorkspaceDrift();
    // await testAllMatched();
    // await testMissingOnly();
    // await testUntrackedOnly();
    // await testMixedDrift();
    // await testSyncToActual();

    console.log('\n🎉 ✅ All Phase 2 Tests Completed!');
  } catch (error: any) {
    console.error('\n❌ TEST SUITE FAILED:', error.message);
    console.error(error.stack);
  }
}

runPhase2Tests();
