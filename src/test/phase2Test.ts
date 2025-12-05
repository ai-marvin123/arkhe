import { CommandHandler } from "../handlers/CommandHandler";
import { BackendMessage, FrontendMessage } from "../types";
import * as vscode from "vscode";

const fakePanel = {
  webview: {
    postMessage: (data: BackendMessage) => {
      console.log("📩 BACKEND SENT:", JSON.stringify(data, null, 2));

      if (data.command === "AI_RESPONSE" && data.payload.type === "DIAGRAM") {
        console.log("✅ Valid Diagram Structure received!");
      }
    },
  },
} as vscode.WebviewPanel;

async function runTest() {
  console.log("--- TEST 1: Happy Path (NestJS Diagram) ---");

  const msg1: FrontendMessage = {
    command: "GENERATE_STRUCTURE",
    payload: {
      sessionId: "test-sess-01",
      prompt: "create a full nestjs backend folder structure for a scalable project. Include modules for auth, users, database, shared utils, and testing. return mermaid syntax and json graph",
    },
  };

  const handler = new CommandHandler(fakePanel);

  await handler.handle(msg1);

  // console.log("\n--- TEST 2: Chat Only (Text response) ---");
  // const msg2: FrontendMessage = {
  //   command: "GENERATE_STRUCTURE",
  //   payload: { sessionId: "test-sess-01", prompt: "chat hello" },
  // };
  // await handler.handle(msg2);

  // console.log("\n--- TEST 3: Edge Case (Error/Empty) ---");
  // const msg3: FrontendMessage = {
  //   command: "GENERATE_STRUCTURE",
  //   payload: { sessionId: "test-sess-01", prompt: "generate an error" },
  // };
  // await handler.handle(msg3);
}

runTest();
