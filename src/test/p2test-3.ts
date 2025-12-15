// src/test/phase2Test.ts

// ==========================================
// 🎛️ CONTROL PANEL
// ==========================================
const TEST_CONFIG = {
  // We focus mainly on SCENARIO 4 for this test
  SCENARIO_1_MATCHED: false,
  SCENARIO_2_UNTRACKED: false,
  SCENARIO_3_MISSING: false,
  SCENARIO_4_MIXED_EDGE_CHECK: true, // 👈 FOCUS HERE: Verify Edge Filtering
  SCENARIO_5_SYNC: false,
  SCENARIO_6_NO_FILE: false,
};

// ==========================================
// 1. SYSTEM MOCKING & SETUP
// ==========================================
const Module = require('module');
const originalLoad = Module._load;

// Mock VSCode
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

// Require modules
const { CommandHandler } = require('../handlers/CommandHandler');
const { aiService } = require('../services/AiService');

// Patch AI Service
aiService.analyzeDrift = async (missingNodes: any[]) => {
  return `[MOCK AI] Analyzed ${missingNodes.length} missing files.`;
};

// ==========================================
// 2. TEST HELPER
// ==========================================
class SimulationEnvironment {
  private storedDiagram: any | null = null;
  private diskFiles: any[] = [];
  public messages: any[] = [];

  constructor() {}

  // Setup with explicit Edges support
  setup(planNodes: any[], planEdges: any[], diskNodes: any[]) {
    if (planNodes === null) {
      this.storedDiagram = null;
    } else {
      this.storedDiagram = {
        jsonStructure: { nodes: planNodes, edges: planEdges },
      };
    }
    this.diskFiles = diskNodes;
    this.messages = [];
  }

  getMockFileService() {
    return {
      loadDiagram: async () => this.storedDiagram,
      scanDirectory: async () => this.diskFiles,
      saveDiagram: async (_id: string, data: any) => {
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
// 3. RUN TESTS
// ==========================================

async function runEdgeCaseTests() {
  console.log('\n🚀 STARTING EDGE FILTERING TESTS (MIXED DRIFT)');
  console.log('================================================\n');

  // --- DATA FIXTURES ---
  // A: Core file (Matched)
  const NODE_CORE = {
    id: 'src/core.ts',
    label: 'core.ts',
    type: 'FILE',
    path: 'src/core.ts',
  };

  // B: Old file (Missing - deleted from disk)
  const NODE_OLD = {
    id: 'src/old.ts',
    label: 'old.ts',
    type: 'FILE',
    path: 'src/old.ts',
  };

  // C: New file (Untracked - added to disk)
  const NODE_NEW = {
    id: 'src/new.ts',
    label: 'new.ts',
    type: 'FILE',
    path: 'src/new.ts',
  };

  // Edge: Core -> Old (Dependency exists in Plan)
  // This edge should appear in Missing View, but MUST NOT appear in Untracked View
  const EDGE_CORE_TO_OLD = { source: 'src/core.ts', target: 'src/old.ts' };

  const sim = new SimulationEnvironment();
  const handler = new CommandHandler(
    sim.getMockPanel(),
    sim.getMockFileService()
  );

  // ---------------------------------------------------------
  // SCENARIO 4: MIXED DRIFT + EDGE FILTERING CHECK
  // ---------------------------------------------------------
  if (TEST_CONFIG.SCENARIO_4_MIXED_EDGE_CHECK) {
    console.log('🔹 TEST 4: MIXED DRIFT (WITH EDGE VALIDATION)');

    // SETUP:
    // Plan: [Core, Old] + Edge(Core->Old)
    // Disk: [Core, New] (Old is missing, New is untracked)
    sim.setup([NODE_CORE, NODE_OLD], [EDGE_CORE_TO_OLD], [NODE_CORE, NODE_NEW]);

    await handler.handle({
      command: 'CHECK_DRIFT',
      payload: { sessionId: 'test' },
    });

    const msg = sim.messages[0];

    // 1. Check Payload Type
    if (msg?.payload?.type === 'MIXED_DIAGRAM') {
      console.log('   ✅ Correct Type: MIXED_DIAGRAM');

      const missingData = msg.payload.missingDiagramData;
      const untrackedData = msg.payload.untrackedDiagramData;

      // 2. Verify MISSING View
      // Should show Core + Old.
      // Should KEEP the edge Core->Old (to show what dependency broke).
      console.log('\n   🔎 Inspecting MISSING View:');
      console.log(
        `      - Nodes: ${missingData.jsonStructure.nodes.length} (Expected 2: Core, Old)`
      );
      console.log(
        `      - Edges: ${missingData.jsonStructure.edges.length} (Expected 1: Core->Old)`
      );

      console.log(missingData.jsonStructure);

      if (missingData.jsonStructure.edges.length === 1) {
        console.log('      ✅ Edge preserved correctly in Missing View.');
      } else {
        console.error('      ❌ EDGE MISSING! It should be there.');
      }

      // 3. Verify UNTRACKED View
      // Should show Core + New.
      // Should REMOVE the edge Core->Old (because Old is not in this view).
      console.log('\n   🔎 Inspecting UNTRACKED View:');
      console.log(
        `      - Nodes: ${untrackedData.jsonStructure.nodes.length} (Expected 2: Core, New)`
      );
      console.log(
        `      - Edges: ${untrackedData.jsonStructure.edges.length} (Expected 0)`
      );

      console.log(untrackedData.jsonStructure);

      if (untrackedData.jsonStructure.edges.length === 0) {
        console.log('      ✅ Edge filtered out correctly in Untracked View.');
      } else {
        console.error(
          '      ❌ LOGIC ERROR: Edge pointing to missing node still exists!'
        );
        console.log('         (This will cause ghost nodes in Frontend)');
      }
    } else {
      console.log('   ❌ Wrong Type. Received:', msg?.payload?.type);
    }
  }

  // ... (Other standard cases if enabled in TEST_CONFIG) ...
  if (TEST_CONFIG.SCENARIO_1_MATCHED) {
    /* ... same as before ... */
  }
  // You can keep the other scenarios here if you want to run full suite

  console.log('\n✅ TEST COMPLETE.');
}

runEdgeCaseTests().catch((err) => console.error(err));
