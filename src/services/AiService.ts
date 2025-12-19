import 'dotenv/config';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { SessionManager } from '../managers/SessionManager'; // Ensure this path is correct
import { AiPayload, AiPayloadSchema } from '../types';
import { SystemMessage } from 'langchain';
import { ChatOpenAI } from '@langchain/openai';
import { generateMermaidFromJSON } from '../utils/mermaidGenerator';
import { StructureNode } from '../types';

import { ConfigManager } from '../managers/ConfigManager';

const SYSTEM_PROMPT = `
You are an expert AI Software Architect. Visualize project folder structures based on user descriptions.
Respond strictly in JSON format. MODE A | MODE B.

MODE A: SUFFICIENT DATA. Format:
{
  "type": "DIAGRAM",
  "message": "(Brief architecture explanation)",
  "data": {
    "jsonStructure": {
      "nodes": [
        {
          "id": "root",
          "label": "root",
          "type": "FOLDER",
          "level": 0,
          "path": "/root",
          "parentId": null
        }
      ],
      "edges": [{ "source": "parent-id", "target": "child-id" }]
    }
  }
}

MODE B: INSUFFICIENT DATA. Format:
{
  "type": "TEXT",
  "message": "Politely ask for clarification.",
  "data": null
}

RULES:
1. You MUST wrap the JSON output in markdown code blocks (e.g., \`\`\`json ... \`\`\`). Do NOT output plain text without the markdown wrapper.
2. Node "type" must be exactly "FILE" or "FOLDER" (Uppercase).
3. IDs must be unique.
4. ROOT NODE RULE: There must be EXACTLY ONE root node. Its "id" must be "root". Its "label" must be "root". Its "parentId" must be null. Its "level" is 0. Its "path" must be "/root".
5. PATH CONVENTION: 
   - Root node path is "/root".
   - All child paths MUST start with "/root/" (e.g., "/root/src", "/root/package.json").
   - IDs of children should generally match their full path (e.g. "/root/src/app.ts") to ensure uniqueness.
6. Always include file extensions.
7. Don't need include "FILE" or "FOLDER" in label of node.
`;

class AiService {
  private chatModelJson: ChatOpenAI | null = null;
  private chatModelText: ChatOpenAI | null = null;

  private async getModel(type: 'json' | 'text'): Promise<ChatOpenAI> {
    // Check reset
    if (type === 'json' && this.chatModelJson) {
      return this.chatModelJson;
    }
    if (type === 'text' && this.chatModelText) {
      return this.chatModelText;
    }

    const apiKey = await ConfigManager.getInstance().getApiKey();
    const { model } = ConfigManager.getInstance().getConfig();

    console.log('model: ', model);

    if (!apiKey) {
      throw new Error('API Key not configured.');
    }

    const instance = new ChatOpenAI({
      modelName: model,
      temperature: type === 'json' ? 0 : 0.7,
      apiKey: apiKey,
      modelKwargs:
        type === 'json'
          ? { response_format: { type: 'json_object' } }
          : undefined,
    });

    if (type === 'json') {
      this.chatModelJson = instance;
    }
    if (type === 'text') {
      this.chatModelText = instance;
    }

    return instance;
  }

  updateModelConfiguration() {
    console.log('[AiService] Clearing cached models due to config change.');
    this.chatModelJson = null;
    this.chatModelText = null;
  }

  async verifyApiKey(apiKey: string, modelName: string): Promise<boolean> {
    try {
      console.log(`[AiService] Verifying key for model: ${modelName}...`);

      const tempModel = new ChatOpenAI({
        modelName: modelName, // Check if this key has access to this specific model
        temperature: 0,
        apiKey: apiKey,
        maxTokens: 1, // Keep it minimal to save tokens/latency
      });

      // Send a ping message
      await tempModel.invoke('Hello');

      console.log('[AiService] Verification successful.');
      return true;
    } catch (error) {
      console.error('[AiService] Key verification failed:', error);
      return false;
    }
  }

  /**
   * Generates project structure using LCEL (LangChain Expression Language)
   */
  async generateStructure(
    sessionId: string,
    userPrompt: string
  ): Promise<AiPayload> {
    try {
      // A. Get History Instance (Memory)
      const sessionManager = SessionManager.getInstance();
      const history = sessionManager.getSession(sessionId);
      const historyMessages = await history.getMessages();

      console.log('historyMessages', historyMessages);

      // B. Create Prompt Template
      const prompt = ChatPromptTemplate.fromMessages([
        new SystemMessage(SYSTEM_PROMPT),
        new MessagesPlaceholder('chat_history'),
        ['human', '{input}'],
      ]);

      // console.log('prompt: ', prompt);

      // C. Create Output Parser
      const parser = new JsonOutputParser();

      // D. Define the Chain (The Pipeline)
      const model = await this.getModel('json');
      const chain = prompt.pipe(model).pipe(parser);

      console.log(`[AiService] Invoking chain for session: ${sessionId}`);

      // E. Execute Chain
      const rawJson = await chain.invoke({
        chat_history: historyMessages,
        input: userPrompt,
      });

      // console.log('rawJson', rawJson);

      // --- CRITICAL STEP: Inject Mermaid Syntax BEFORE Validation ---
      // We process the raw JSON here. If it's a DIAGRAM type, we calculate the mermaid string
      // and inject it into the object so that it satisfies the Zod schema in the next step.
      if (rawJson?.type === 'DIAGRAM' && rawJson?.data?.jsonStructure) {
        try {
          const syntax = generateMermaidFromJSON(rawJson.data.jsonStructure);
          // Inject mermaidSyntax into the data object
          rawJson.data.mermaidSyntax = syntax;
          console.log('[AiService] Mermaid syntax generated successfully.');
        } catch (err) {
          console.error('[AiService] Failed to generate mermaid syntax:', err);
          // We can optionally fallback or let Zod fail depending on strategy
        }
      }

      // F. Validate with Zod (Gatekeeper)
      const validation = AiPayloadSchema.safeParse(rawJson);

      if (!validation.success) {
        console.error('[AiService] Validation Failed:', validation.error);
        return this.fallbackText(
          'AI generated invalid structure. Please try again with a clearer description.'
        );
      }

      const validatedData = validation.data;

      // G. Update Memory (Manually add this turn)
      await history.addUserMessage(userPrompt);

      await history.addAIMessage(JSON.stringify(validatedData));

      return validatedData;
    } catch (error) {
      console.error('[AiService] Error:', error);
      return this.fallbackText('System error while contacting AI.');
    }
  }

  async analyzeDrift(missingNodes: StructureNode[]): Promise<string> {
    if (!missingNodes || missingNodes.length === 0) {
      return 'No missing files detected.';
    }

    const list = missingNodes.map((node) => `- ${node.id}`).join('\n');

    const prompt = `
You are a Tech Lead. Analyze these missing files from the repository:

${list}

Provide a concise, plain-text explanation (max 50 words, 2-3 sentences).
Focus only on the most likely cause (e.g., branch mismatch, accidental deletion, or rename) and the immediate action to verify or fix it.
Do NOT use bullet points, headers, or markdown.
`.trim();

    try {
      const model = await this.getModel('text');
      const response = await model.invoke(prompt);

      // LangChain ChatOpenAI always returns a message object
      if ((response as any)?.content) {
        return typeof response.content === 'string'
          ? response.content
          : JSON.stringify(response.content);
      }

      return 'Missing files detected. Review recent changes and update or restore the plan.';
    } catch (error) {
      console.error('[AiService] analyzeDrift error:', error);
      return 'Unable to analyze drift automatically. Please review missing files manually.';
    }
  }

  async saveContext(
    sessionId: string,
    userAction: string,
    aiPayload: AiPayload
  ): Promise<void> {
    try {
      const sessionManager = SessionManager.getInstance();
      const history = sessionManager.getSession(sessionId);

      await history.addUserMessage(userAction);

      await history.addAIMessage(JSON.stringify(aiPayload));

      console.log(`[AiService] Saved context for action: "${userAction}"`);
    } catch (error) {
      console.error('[AiService] Failed to save context:', error);
    }
  }

  private fallbackText(message: string): AiPayload {
    return {
      type: 'TEXT',
      message,
      data: undefined,
    };
  }
}

export const aiService = new AiService();
