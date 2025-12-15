// src/test/phase2Test.ts

// ==========================================
// 🎛️ CONTROL PANEL (TOGGLE TESTS HERE)
// ==========================================
const TEST_CONFIG = {
  SCENARIO_1_MATCHED: true, // ✅ Expect: ALL_MATCHED
  SCENARIO_2_UNTRACKED: true, // ✅ Expect: UNTRACKED_DIAGRAM
  SCENARIO_3_MISSING: true, // ✅ Expect: MISSING_DIAGRAM
  SCENARIO_4_MIXED: true, // ✅ Expect: MISSING... then UNTRACKED...
  SCENARIO_5_SYNC: true, // ✅ Expect: SYNC Success -> ALL_MATCHED
  SCENARIO_6_NO_FILE: true, // ✅ Expect: NO_SAVED_DIAGRAM (New Case)
};

// ==========================================
// 1. SYSTEM MOCKING & SETUP
// ==========================================
const Module = require('module');
const originalLoad = Module._load;

// Mock VSCode module
Module._load = function (request: string, parent: any, isMain: boolean) {
  if (request === 'vscode') {
    return {
      workspace: {},
      window: {
        showErrorMessage: console.error,
        showWarningMessage: console.warn,
        showInformationMessage: console.log,
      },
      Uri: { file: (f: string) => ({ fsPath: f }) },
      WebviewPanel: class {},
    };
  }
  return originalLoad(request, parent, isMain);
};

// Require modules AFTER mocking
const { CommandHandler } = require('../handlers/CommandHandler');
const { aiService } = require('../services/AiService');

// ⚡ MONKEY PATCH AI SERVICE
aiService.analyzeDrift = async (missingNodes: any[]) => {
  return `[MOCK AI] Analyzed ${missingNodes.length} missing files.`;
};

// ==========================================
// 2. TEST HELPER: SIMULATION ENVIRONMENT
// ==========================================
class SimulationEnvironment {
  private storedDiagram: any | null = null;
  private diskFiles: any[] = [];
  public messages: any[] = [];

  constructor() {}

  // Reset environment for a specific test case
  // If planNodes is NULL, it simulates "No Saved File"
  setup(planNodes: any[] | null, diskNodes: any[]) {
    if (planNodes === null) {
      this.storedDiagram = null;
    } else {
      this.storedDiagram = { jsonStructure: { nodes: planNodes, edges: [] } };
    }

    this.diskFiles = diskNodes;
    this.messages = [];
  }

  getMockFileService() {
    return {
      loadDiagram: async () => this.storedDiagram,
      scanDirectory: async () => this.diskFiles,
      saveDiagram: async (_id: string, data: any) => {
        console.log('      💾 [MockFS] File Saved.');
        this.storedDiagram = data;
        return true;
      },
    };
  }

  getMockPanel() {
    return {
      webview: { postMessage: (msg: any) => this.messages.push(msg) },
    } as any;
  }
}

// ==========================================
// 3. RUN SELECTIVE TESTS
// ==========================================

async function runSelectiveTests() {
  console.log('\n🚀 STARTING SELECTIVE TESTS');
  console.log('=======================================\n');

  // --- DATA FIXTURES ---
  const NODE_APP = {
    id: 'src/app.ts',
    label: 'app.ts',
    type: 'FILE',
    path: 'src/app.ts',
  };
  const NODE_NEW = {
    id: 'src/new.ts',
    label: 'new.ts',
    type: 'FILE',
    path: 'src/new.ts',
  };

  const sim = new SimulationEnvironment();
  const handler = new CommandHandler(
    sim.getMockPanel(),
    sim.getMockFileService()
  );

  // ---------------------------------------------------------
  // SCENARIO 1: MATCHED
  // ---------------------------------------------------------
  if (TEST_CONFIG.SCENARIO_1_MATCHED) {
    console.log('🔹 TEST 1: MATCHED');
    // Setup: Plan and Disk are identical
    sim.setup([NODE_APP], [NODE_APP]);

    await handler.handle({
      command: 'CHECK_DRIFT',
      payload: { sessionId: 'test' },
    });
    printResult(sim.messages);
  }

  // ---------------------------------------------------------
  // SCENARIO 2: UNTRACKED
  // ---------------------------------------------------------
  if (TEST_CONFIG.SCENARIO_2_UNTRACKED) {
    console.log('\n🔹 TEST 2: UNTRACKED');
    // Setup: Disk has extra file (NODE_NEW)
    sim.setup([NODE_APP], [NODE_APP, NODE_NEW]);

    await handler.handle({
      command: 'CHECK_DRIFT',
      payload: { sessionId: 'test' },
    });
    printResult(sim.messages);
  }

  // ---------------------------------------------------------
  // SCENARIO 3: MISSING
  // ---------------------------------------------------------
  if (TEST_CONFIG.SCENARIO_3_MISSING) {
    console.log('\n🔹 TEST 3: MISSING');
    // Setup: Disk is empty (Missing NODE_APP)
    sim.setup([NODE_APP], []);

    await handler.handle({
      command: 'CHECK_DRIFT',
      payload: { sessionId: 'test' },
    });
    printResult(sim.messages);
  }

  // ---------------------------------------------------------
  // SCENARIO 4: MIXED
  // ---------------------------------------------------------
  if (TEST_CONFIG.SCENARIO_4_MIXED) {
    console.log('\n🔹 TEST 4: MIXED');
    // Setup: Plan has APP, Disk has NEW (APP missing, NEW untracked)
    sim.setup([NODE_APP], [NODE_NEW]);

    await handler.handle({
      command: 'CHECK_DRIFT',
      payload: { sessionId: 'test' },
    });
    printResult(sim.messages);
  }

  // ---------------------------------------------------------
  // SCENARIO 5: SYNC FLOW
  // ---------------------------------------------------------
  if (TEST_CONFIG.SCENARIO_5_SYNC) {
    console.log('\n🔹 TEST 5: SYNC & VERIFY');
    // Setup: Start with drift
    sim.setup([NODE_APP], [NODE_APP, NODE_NEW]);

    console.log('   1. Triggering Sync...');
    await handler.handle({
      command: 'SYNC_TO_ACTUAL',
      payload: { sessionId: 'test' },
    });
    printResult(sim.messages); // Expect DIAGRAM

    console.log('   2. Verifying (Check Drift again)...');
    sim.messages = [];
    await handler.handle({
      command: 'CHECK_DRIFT',
      payload: { sessionId: 'test' },
    });
    printResult(sim.messages); // Expect ALL_MATCHED
  }

  // ---------------------------------------------------------
  // SCENARIO 6: NO FILE SAVED (NEW)
  // ---------------------------------------------------------
  if (TEST_CONFIG.SCENARIO_6_NO_FILE) {
    console.log('\n🔹 TEST 6: NO SAVED FILE (EMPTY LOAD)');
    // Setup: Plan is NULL (simulates no .repoplan.json found)
    sim.setup(null, [NODE_APP]);

    await handler.handle({
      command: 'CHECK_DRIFT',
      payload: { sessionId: 'test' },
    });

    // Should NOT crash. Should return NO_SAVED_DIAGRAM.
    printResult(sim.messages);
  }

  console.log('\n✅ DONE.');
}

// Helper to print results
function printResult(messages: any[]) {
  if (messages.length === 0) {
    console.log('      ❌ No messages received.');
    return;
  }
  messages.forEach((msg, i) => {
    const type = msg.payload.type;
    const info = msg.payload.message
      ? ` - "${msg.payload.message.substring(0, 60)}"`
      : '';
    console.log(`      📩 [Msg ${i + 1}] ${type}${info}`);
  });
}

runSelectiveTests().catch((err) => console.error(err));
