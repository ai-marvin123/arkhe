import 'dotenv/config';
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
import { FileService } from './FileService';
import { DriftService } from './DriftService';

import { SYSTEM_PROMPT } from './SystemPrompt';

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

    // console.log('model: ', model);

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
    // console.log('[AiService] Clearing cached models due to config change.');
    this.chatModelJson = null;
    this.chatModelText = null;
  }

  async verifyApiKey(apiKey: string, modelName: string): Promise<boolean> {
    try {
      // console.log(`[AiService] Verifying key for model: ${modelName}...`);

      const tempModel = new ChatOpenAI({
        modelName: modelName, // Check if this key has access to this specific model
        temperature: 0,
        apiKey: apiKey,
        maxTokens: 100, // Keep it minimal to save tokens/latency
      });

      // Send a ping message
      await tempModel.invoke('Ping');

      // console.log('[AiService] Verification successful.');
      return true;
    } catch (error) {
      console.error('[AiService] Key verification failed:', error);
      return false;
    }
  }

  private minifyPayload(payload: AiPayload): string {
    const clone = JSON.parse(JSON.stringify(payload));

    if (clone.data?.mermaidSyntax) {
      delete clone.data.mermaidSyntax;
    }

    return JSON.stringify(clone);
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

      // console.log('historyMessages', historyMessages);

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

      // console.log(`[AiService] Invoking chain for session: ${sessionId}`);

      // E. Execute Chain
      const rawJson = await chain.invoke({
        chat_history: historyMessages,
        input: userPrompt,
      });

      // --- MODE C (TRIGGER_SCAN) ---
      if (rawJson?.type === 'TRIGGER_SCAN') {
        // console.log('[AiService] Mode C detected. Scanning disk...');

        // 1. Scan Disk
        const { nodes: actualNodes, edges: actualEdges } =
          await FileService.scanDirectory(sessionId);

        // 2. Handle Empty Workspace
        if (!actualNodes.length) {
          const emptyPayload: AiPayload = {
            type: 'TEXT',
            message: 'Workspace is empty. Cannot generate diagram from disk.',
            data: undefined,
          };

          await history.addUserMessage(userPrompt);
          await history.addAIMessage(this.minifyPayload(emptyPayload));
          return emptyPayload;
        }

        // 3. Construct Real Diagram Payload
        const cleanNodes = actualNodes.map((n) => ({ ...n }));
        const diagramData = DriftService.generateDiagramData(
          cleanNodes,
          actualEdges
        );

        const realPayload: AiPayload = {
          type: 'DIAGRAM',
          message: 'Repository structure visualized from disk.',
          data: diagramData,
        };

        // 4. Save Context & Return
        await history.addUserMessage(userPrompt);
        await history.addAIMessage(this.minifyPayload(realPayload));

        return realPayload;
      }

      // --- CRITICAL STEP: Inject Mermaid Syntax BEFORE Validation ---
      // We process the raw JSON here. If it's a DIAGRAM type, we calculate the mermaid string
      // and inject it into the object so that it satisfies the Zod schema in the next step.
      if (rawJson?.type === 'DIAGRAM' && rawJson?.data?.jsonStructure) {
        try {
          const syntax = generateMermaidFromJSON(rawJson.data.jsonStructure);
          // Inject mermaidSyntax into the data object
          console.log('🧜‍♀️Mermaid', syntax);
          rawJson.data.mermaidSyntax = syntax;
          // console.log('[AiService] Mermaid syntax generated successfully.');
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

      await history.addAIMessage(this.minifyPayload(validatedData));

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

      await history.addAIMessage(this.minifyPayload(aiPayload));

      // console.log(`[AiService] Saved context for action: "${userAction}"`);
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
