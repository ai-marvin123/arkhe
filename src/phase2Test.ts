import { CommandHandler } from './handlers/CommandHandler';
import { BackendMessage, FrontendMessage } from './types';

const fakePanel = {
  webview: {
    postMessage: (data: BackendMessage) => {
      console.log('📩 BACKEND SENT:', JSON.stringify(data, null, 2));

      if (data.command === 'AI_RESPONSE' && data.payload.type === 'DIAGRAM') {
        console.log('✅ Valid Diagram Structure received!');
      }
    },
  },
};

async function runTest() {
  console.log('--- TEST 1: Happy Path (NestJS Diagram) ---');

  const msg1: FrontendMessage = {
    command: 'GENERATE_STRUCTURE',
    payload: {
      sessionId: 'test-sess-01',
      prompt: 'Create a nestjs project structure',
    },
  };

  await CommandHandler.handle(fakePanel as any, msg1);

  console.log('\n--- TEST 2: Chat Only (Text response) ---');
  const msg2: FrontendMessage = {
    command: 'GENERATE_STRUCTURE',
    payload: { sessionId: 'test-sess-01', prompt: 'chat hello' },
  };
  await CommandHandler.handle(fakePanel as any, msg2);

  console.log('\n--- TEST 3: Edge Case (Error/Empty) ---');
  const msg3: FrontendMessage = {
    command: 'GENERATE_STRUCTURE',
    payload: { sessionId: 'test-sess-01', prompt: 'generate an error' },
  };
  await CommandHandler.handle(fakePanel as any, msg3);
}

runTest();
