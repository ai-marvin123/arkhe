import { CommandHandler } from '../handlers/CommandHandler';
import { MessageToFrontend, FrontendMessage } from '../types';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const fakePanel = {
  webview: {
    postMessage: (data: MessageToFrontend) => {
      // console.log("📩 BACKEND SENT:", JSON.stringify(data, null, 2));
      const outputPath = path.join(__dirname, 'backend_output.json');
      fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
      console.log(`📩 BACKEND SENT: Data saved to ${outputPath}`);

      if (data.command === 'AI_RESPONSE' && data.payload.type === 'DIAGRAM') {
        const mermaidPath = path.join(__dirname, 'backend_output.mmd');
        const syntax = data.payload.data.mermaidSyntax;

        fs.writeFileSync(mermaidPath, syntax);
        console.log(`📩 BACKEND SENT: Data saved to ${mermaidPath}`);
        console.log('✅ Valid Diagram Structure received!');
      }
    },
  },
} as vscode.WebviewPanel;

// --- TEST 1: HAPPY PATH (Diagram) ---
async function runTest1() {
  console.log('--- TEST 1: Happy Path (NestJS Diagram) ---');

  const msg1: FrontendMessage = {
    command: 'GENERATE_STRUCTURE',
    payload: {
      sessionId: 'test-sess-01',
      prompt:
        'create a full nestjs backend folder structure for a scalable project. Include modules for auth, users, database, shared utils, and testing. return mermaid syntax and json graph',
    },
  };

  const handler = new CommandHandler(fakePanel);

  await handler.handle(msg1);
}

// --- TEST 2: CHAT ONLY (Text Response) ---
async function runTest2() {
  console.log('\n--- TEST 2: Chat Only (Text response) ---');
  const msg: FrontendMessage = {
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
  const msg: FrontendMessage = {
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
  const msg: FrontendMessage = {
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
  const msg: FrontendMessage = {
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

// ==========================================
// MAIN RUNNER
// ==========================================
async function runAllTests() {
  // await runTest2();
  // await runTest6();
  // await runTest7();
  await runTest8();
}

runAllTests();
