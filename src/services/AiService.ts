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

export const chatModel = new ChatOpenAI({
  modelName: 'gpt-4.1-mini',
  temperature: 0,
  apiKey: process.env.OPENAI_API_KEY,
});

// 1. Initialize Model
// const chatModel = new ChatGoogleGenerativeAI({
//   model: 'gemini-2.5-flash-lite',
//   temperature: 0.7,
//   apiKey: process.env.GEMINI_API_KEY,
// });

// 2. System Prompt
// const SYSTEM_PROMPT = `
// You are an expert AI Software Architect. Your job is to visualize project folder structures based on user descriptions.
// You must respond strictly in JSON format. RESPONSE MODES (Choose one based on user input): MODE A | MODE B.

// MODE A: SUFFICIENT DATA (User description is clear). If you can reasonably infer a project structure, generate the diagram. Format:
// {
//   "type": "DIAGRAM",
//   "message": "(Briefly explain the architecture choices)",
//   "data": {
//     "mermaidSyntax": "graph TD; ... (Mermaid code for the tree)",
//     "jsonStructure": {
//       "nodes": [
//         {
//           "id": "unique-id",
//           "label": "filename.ext",
//           "type": "FILE",
//           "level": number,
//           "path": "/path/to/file",
//           "parentId": "parent-id-or-null"
//         }
//       ],
//       "edges": [{ "source": "parent-id", "target": "child-id" }]
//     }
//   }
// }

// MODE B: INSUFFICIENT DATA (Vague or ambiguous). If the prompt is too short (e.g., "help", "code", "structure") or nonsensical, ask for clarification. Format:
// {
//   "type": "TEXT",
//   "message": "Politely suggest what information you need (e.g., 'Could you specify the language or framework?').",
//   "data": null
// }

// RULES:
// 1. Output RAW JSON only. Do NOT use markdown backticks like \`\`\`json.
// 2. Node "type" must be exactly "FILE" or "FOLDER" (Uppercase).
// 3. "parentId" should be null for the root node.
// 4. IDs must be unique.
// 5. Don't need include "FILE" or "FOLDER" in label of node.
// 6. Mermaid Syntax: Node labels must NOT contain special characters like parentheses (). Use simple alphanumeric text only (e.g., use "root" instead of "root (FOLDER)").
// 7. NAMING CONVENTION: Always include file extensions for files (e.g., "App.tsx", "server.js", "style.css"). Do NOT strip the dot (e.g., avoid "Apptsx" or "server_js").
// 8. MERMAID SHAPE: You MUST use parentheses () for all node definitions to create rounded edges. Use syntax id(Label) instead of id[Label].
//    - CORRECT: A(src) --> B(App.tsx)
//    - WRONG: A[src] --> B[App.tsx]
// `;

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
          "id": "unique-id",
          "label": "filename.ext",
          "type": "FILE",
          "level": number,
          "path": "/path/to/file",
          "parentId": "parent-id-or-null"
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
1. Output RAW JSON only. Do NOT use markdown backticks like \`\`\`json.
2. Node "type" must be exactly "FILE" or "FOLDER" (Uppercase).
3. IDs must be unique.
4. "parentId" should be null for the root node.
5. Always include file extensions.
6. Don't need include "FILE" or "FOLDER" in label of node.
`;

class AiService {
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
      const chain = prompt.pipe(chatModel).pipe(parser);

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

    const list = missingNodes
      .map((node) => `- ${node.id}`)
      .join('\n');

    const prompt = `
You are a Tech Lead.

These files or folders are in the approved architecture plan
but are missing from the actual repository:

${list}

Analyze why this might have happened (renamed, moved, deleted, typo, branch mismatch)
and suggest concrete steps to fix the issue.

Keep the response short and actionable.
`.trim();

    try {
      const response = await chatModel.invoke(prompt);

// LangChain ChatOpenAI always returns a message object
if ((response as any)?.content) {
  return typeof response.content === 'string'
    ? response.content
    : JSON.stringify(response.content);
}

return 'Missing files detected. Review recent changes and update or restore the plan.';

      return 'Missing files detected. Review recent changes and update or restore the plan.';
    } catch (error) {
      console.error('[AiService] analyzeDrift error:', error);
      return 'Unable to analyze drift automatically. Please review missing files manually.';
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
