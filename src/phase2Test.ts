import { CommandHandler } from "./handlers/CommandHandler";

// Fake panel to capture backend responses
const fakePanel = {
  webview: {
    postMessage: (data: any) => {
      console.log("BACKEND RESPONSE:", data);
    },
  },
};

async function chatting() {
  console.log("Test 1: NestJS → should return a DIAGRAM mock");
  await CommandHandler.handle(fakePanel as any, {
    command: "generateDiagram",
    prompt: "nestjs project",
  });

  console.log("\nTest 2: Chat → should return TEXT mock");
  await CommandHandler.handle(fakePanel as any, {
    command: "getMockChat",
  });

  console.log("\nTest 3: Error → should return INVALID MOCK");
  await CommandHandler.handle(fakePanel as any, {
    command: "generateDiagram",
    prompt: "error please",
  });

  console.log("\nTest 4: Unknown Command");
  await CommandHandler.handle(fakePanel as any, {
    command: "unknownAction",
  });
}

chatting();
