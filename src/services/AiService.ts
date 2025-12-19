import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { SystemMessage } from 'langchain';
import { ChatOpenAI } from '@langchain/openai';

import { SessionManager } from '../managers/SessionManager';
import { ConfigManager } from '../managers/ConfigManager';
import { AiPayload, AiPayloadSchema, StructureNode } from '../types';
import { generateMermaidFromJSON } from '../utils/mermaidGenerator';

const SYSTEM_PROMPT = `
You are an expert AI Software Architect. Visualize project folder structures based on user descriptions.
Respond strictly in JSON format. MODE A | MODE B.
...
`;

class AiService {
  private chatModelJson: ChatOpenAI | null = null;
  private chatModelText: ChatOpenAI | null = null;

  // ──────────────────────────────────────────────
  // Lazy model loaders
  // ──────────────────────────────────────────────
  private async getChatModelJson(): Promise<ChatOpenAI> {
    if (this.chatModelJson){ return this.chatModelJson;
    }

    const cm = ConfigManager.getInstance();
    const apiKey = await cm.getApiKey();
    const { provider, model } = cm.getConfig();

    if (!apiKey) {
      throw new Error('API Key not configured. Please set it in Arkhe Settings.');
    }

    if (provider !== 'openai') {
      throw new Error(`Provider "${provider}" not supported.`);
    }

    this.chatModelJson = new ChatOpenAI({
      apiKey,
      modelName: model,
      temperature: 0,
      modelKwargs: { response_format: { type: 'json_object' } },
    });

    return this.chatModelJson;
  }

  private async getChatModelText(): Promise<ChatOpenAI> {
    if (this.chatModelText){ return this.chatModelText;
    }

    const cm = ConfigManager.getInstance();
    const apiKey = await cm.getApiKey();
    const { provider, model } = cm.getConfig();

    if (!apiKey) {
      throw new Error('API Key not configured. Please set it in Arkhe Settings.');
    }

    if (provider !== 'openai') {
      throw new Error(`Provider "${provider}" not supported.`);
    }

    this.chatModelText = new ChatOpenAI({
      apiKey,
      modelName: model,
      temperature: 0.7,
    });

    return this.chatModelText;
  }

  // ──────────────────────────────────────────────
  // Required by CommandHandler
  // ──────────────────────────────────────────────
  public updateModelConfiguration(): void {
    this.chatModelJson = null;
    this.chatModelText = null;
  }

  // ──────────────────────────────────────────────
  // Core AI Methods
  // ──────────────────────────────────────────────
  async generateStructure(
    sessionId: string,
    userPrompt: string
  ): Promise<AiPayload> {
    try {
      const history = SessionManager.getInstance().getSession(sessionId);
      const historyMessages = await history.getMessages();

      const prompt = ChatPromptTemplate.fromMessages([
        new SystemMessage(SYSTEM_PROMPT),
        new MessagesPlaceholder('chat_history'),
        ['human', '{input}'],
      ]);

      const parser = new JsonOutputParser();
      const model = await this.getChatModelJson();
      const chain = prompt.pipe(model).pipe(parser);

      const rawJson = await chain.invoke({
        chat_history: historyMessages,
        input: userPrompt,
      });

      if (rawJson?.type === 'DIAGRAM' && rawJson?.data?.jsonStructure) {
        rawJson.data.mermaidSyntax = generateMermaidFromJSON(
          rawJson.data.jsonStructure
        );
      }

      const validation = AiPayloadSchema.safeParse(rawJson);
      if (!validation.success) {
        return this.fallbackText(
          'AI generated invalid structure. Please try again.'
        );
      }

      await history.addUserMessage(userPrompt);
      await history.addAIMessage(JSON.stringify(validation.data));

      return validation.data;
    } catch (err) {
      console.error('[AiService] generateStructure error:', err);
      return this.fallbackText('System error while contacting AI.');
    }
  }

  async analyzeDrift(missingNodes: StructureNode[]): Promise<string> {
    if (!missingNodes?.length){ return 'No missing files detected.';
    }
    const prompt = `
You are a Tech Lead. Analyze these missing files:
${missingNodes.map((n) => `- ${n.id}`).join('\n')}
`.trim();

    try {
      const model = await this.getChatModelText();
      const response = await model.invoke(prompt);
      return typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);
    } catch {
      return 'Unable to analyze drift automatically.';
    }
  }

  async saveContext(
    sessionId: string,
    userAction: string,
    aiPayload: AiPayload
  ): Promise<void> {
    const history = SessionManager.getInstance().getSession(sessionId);
    await history.addUserMessage(userAction);
    await history.addAIMessage(JSON.stringify(aiPayload));
  }

  private fallbackText(message: string): AiPayload {
    return { type: 'TEXT', message, data: undefined };
  }
}

export const aiService = new AiService();
