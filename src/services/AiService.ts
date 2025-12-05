import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
// import { SYSTEM_PROMPT } from "../llm/systemPrompt";
import { sessionManager } from "../managers/SessionManager";
// import { validateAiResponse } from "../schemas/validation";

import { AiResponsePayload, DiagramData, AiResponseSchema } from "../types";

import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export const chatModel = new ChatOpenAI({
  modelName: "gpt-4.1-mini",
  temperature: 0,
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChatHistoryEntry {
  user: string;
  assistant: string;
}

export const SYSTEM_PROMPT = `
You are an AI software architect that generates project structure diagrams
on request and respond strictly in JSON.

You must return output according to this format:

{
  "type": "TEXT" | "DIAGRAM",
  "message": "string",
  "data": null | {
    "mermaidSyntax": "string",
    "jsonStructure": {
      "nodes": [
        {
          "id": "string",
          "label": "string",
          "type": "FILE" | "FOLDER",
          "level": number,
          "path": "string",
          "parentId": "string|null"
        }
      ],
      "edges": [
        {
          "source": "string",
          "target": "string"
        }
      ]
    }
  }
}

RULES:
- Never output Markdown or backticks.
- If you cannot understand prompt, output TEXT with "I need clarification".
- If output type is TEXT, data MUST be null.
- IDs must be unique.

Reply with ONLY valid JSON.
`;

class AiService {
  async generateStructure(
    sessionId: string,
    userPrompt: string
  ): Promise<AiResponsePayload> {
    const history = sessionManager.get(sessionId);

    const messages = [
      new SystemMessage(SYSTEM_PROMPT),
      new HumanMessage(this.buildPrompt(history, userPrompt)),
    ];

    let rawOutput: string;

    try {
      const aiReply = await chatModel.invoke(messages);

      rawOutput =
        typeof aiReply.content === "string"
          ? aiReply.content
          : JSON.stringify(aiReply.content);
    } catch {
      return this.fallbackText("Model request failed — refine your prompt.");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawOutput);
    } catch {
      return this.fallbackText(
        "AI returned invalid JSON — refine your description."
      );
    }

    const validation = AiResponseSchema.safeParse(parsed); //validateAiResponse(parsed);

    if (!validation.success) {
      return this.fallbackText(
        "AI output did not match required structure — try again."
      );
    }

    const validated = validation.data!;

    sessionManager.add(sessionId, {
      user: userPrompt,
      assistant: validated.message,
    });

    return validated;
  }

  private buildPrompt(
    history: ChatHistoryEntry[],
    currentPrompt: string
  ): string {
    if (!history.length) {
      return currentPrompt;
    }

    const formatted = history
      .map((h) => `User: ${h.user}\nAssistant: ${h.assistant}`)
      .join("\n\n");

    return `${formatted}\n\nUser: ${currentPrompt}`;
  }

  private fallbackText(message: string): AiResponsePayload {
    return { type: "TEXT", message };
  }
}

export const aiService = new AiService();
