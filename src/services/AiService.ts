import "dotenv/config";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { SessionManager } from "../managers/SessionManager"; // Ensure this path is correct
import { AiPayload, AiPayloadSchema, StructureEdge } from "../types";
import { SystemMessage } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { generateMermaidFromJSON } from "../utils/mermaidGenerator";
import { StructureNode } from "../types";

import { ConfigManager } from "../managers/ConfigManager";
import { FileService } from "./FileService";
import { DriftService } from "./DriftService";
import { PerformanceTracker } from "../utils/PerformanceLogger";

import { SYSTEM_PROMPT_V3 } from "./SystemPrompt";

class AiService {
  private chatModelJson: ChatOpenAI | null = null;
  private chatModelText: ChatOpenAI | null = null;

  private async getModel(type: "json" | "text"): Promise<ChatOpenAI> {
    // Check reset
    if (type === "json" && this.chatModelJson) {
      return this.chatModelJson;
    }
    if (type === "text" && this.chatModelText) {
      return this.chatModelText;
    }

    const apiKey = await ConfigManager.getInstance().getApiKey();
    const { model } = ConfigManager.getInstance().getConfig();

    // console.log('model: ', model);

    if (!apiKey) {
      throw new Error("API Key not configured.");
    }

    const instance = new ChatOpenAI({
      modelName: model,
      temperature: type === "json" ? 0 : 0.7,
      apiKey: apiKey,
      modelKwargs:
        type === "json"
          ? { response_format: { type: "json_object" } }
          : undefined,
    });

    if (type === "json") {
      this.chatModelJson = instance;
    }
    if (type === "text") {
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
      await tempModel.invoke("Ping");

      // console.log('[AiService] Verification successful.');
      return true;
    } catch (error) {
      console.error("[AiService] Key verification failed:", error);
      return false;
    }
  }

  private minifyPayload(payload: AiPayload): string {
    const clone = JSON.parse(JSON.stringify(payload));

    // Remove mermaidSyntax (can be regenerated)
    if (clone.data?.mermaidSyntax) {
      delete clone.data.mermaidSyntax;
    }

    // Remove edges (can be regenerated from parentId)
    if (clone.data?.jsonStructure?.edges) {
      delete clone.data.jsonStructure.edges;
    }

    return JSON.stringify(clone);
  }

  /**
   * Generate edges from node parentId relationships
   */
  private generateEdgesFromNodes(nodes: StructureNode[]): StructureEdge[] {
    return nodes
      .filter((node) => node.parentId !== null && node.parentId !== undefined)
      .map((node) => ({
        source: node.parentId!,
        target: node.id,
      }));
  }

  /**
   * Generates project structure using LCEL (LangChain Expression Language)
   */
  async generateStructure(
    sessionId: string,
    userPrompt: string,
    tracker?: PerformanceTracker
  ): Promise<AiPayload> {
    try {
      // Step 3: Session history load
      tracker?.startStep("3_session_history_load");
      const sessionManager = SessionManager.getInstance();
      const history = sessionManager.getSession(sessionId);
      const historyMessages = await history.getMessages();
      tracker?.endStep("3_session_history_load", {
        messageCount: historyMessages.length,
      });

      // Step 4: Prompt template build
      tracker?.startStep("4_prompt_template_build");
      const prompt = ChatPromptTemplate.fromMessages([
        new SystemMessage(SYSTEM_PROMPT_V3),
        new MessagesPlaceholder("chat_history"),
        ["human", "{input}"],
      ]);
      tracker?.endStep("4_prompt_template_build");

      // Step 5: Model init
      tracker?.startStep("5_model_init");
      const model = await this.getModel("json");
      tracker?.setModel(ConfigManager.getInstance().getConfig().model);
      tracker?.endStep("5_model_init", {
        wasCached: this.chatModelJson !== null,
      });

      // Step 6: Chain build
      tracker?.startStep("6_chain_build");
      const parser = new JsonOutputParser();
      const chain = prompt.pipe(model).pipe(parser);
      tracker?.endStep("6_chain_build");

      // Step 7: API call (main bottleneck)
      tracker?.startStep("7_api_call");
      const rawJson = await chain.invoke({
        chat_history: historyMessages,
        input: userPrompt,
      });
      tracker?.endStep("7_api_call");

      // --- MODE C (TRIGGER_SCAN) ---
      if (rawJson?.type === "TRIGGER_SCAN") {
        // console.log('[AiService] Mode C detected. Scanning disk...');

        // 1. Scan Disk
        const { nodes: actualNodes, edges: actualEdges } =
          await FileService.scanDirectory(sessionId);

        // 2. Handle Empty Workspace
        if (!actualNodes.length) {
          const emptyPayload: AiPayload = {
            type: "TEXT",
            message: "Workspace is empty. Cannot generate diagram from disk.",
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
          type: "DIAGRAM",
          message: "Repository structure visualized from disk.",
          data: diagramData,
        };

        // 4. Save Context & Return
        await history.addUserMessage(userPrompt);
        await history.addAIMessage(this.minifyPayload(realPayload));

        return realPayload;
      }

      // Step 8: Auto-generate edges + Mermaid generation
      tracker?.startStep("8_mermaid_generation");
      let nodeCount = 0;
      let edgeCount = 0;
      if (rawJson?.type === "DIAGRAM" && rawJson?.data?.jsonStructure) {
        try {
          // Auto-generate edges from parentId
          const nodes = rawJson.data.jsonStructure.nodes || [];
          const generatedEdges = this.generateEdgesFromNodes(nodes);
          rawJson.data.jsonStructure.edges = generatedEdges;

          // Generate mermaid syntax
          const syntax = generateMermaidFromJSON(rawJson.data.jsonStructure);
          rawJson.data.mermaidSyntax = syntax;
          nodeCount = nodes.length;
          edgeCount = generatedEdges.length;
        } catch (err) {
          console.error("[AiService] Failed to generate mermaid syntax:", err);
        }
      }
      tracker?.endStep("8_mermaid_generation", { nodeCount, edgeCount });

      // Step 9: Zod validation
      tracker?.startStep("9_zod_validation");
      const validation = AiPayloadSchema.safeParse(rawJson);
      tracker?.endStep("9_zod_validation");

      if (!validation.success) {
        console.error("[AiService] Validation Failed:", validation.error);
        return this.fallbackText(
          "AI generated invalid structure. Please try again with a clearer description."
        );
      }

      const validatedData = validation.data;

      // Step 10: History save
      tracker?.startStep("10_history_save");
      await history.addUserMessage(userPrompt);
      await history.addAIMessage(this.minifyPayload(validatedData));
      tracker?.endStep("10_history_save");

      return validatedData;
    } catch (error) {
      console.error("[AiService] Error:", error);
      tracker?.setError(error instanceof Error ? error.message : String(error));
      return this.fallbackText("System error while contacting AI.");
    }
  }

  async analyzeDrift(missingNodes: StructureNode[]): Promise<string> {
    if (!missingNodes || missingNodes.length === 0) {
      return "No missing files detected.";
    }

    const list = missingNodes.map((node) => `- ${node.id}`).join("\n");

    const prompt = `
You are a Tech Lead. Analyze these missing files from the repository:

${list}

Provide a concise, plain-text explanation (max 50 words, 2-3 sentences).
Focus only on the most likely cause (e.g., branch mismatch, accidental deletion, or rename) and the immediate action to verify or fix it.
Do NOT use bullet points, headers, or markdown.
`.trim();

    try {
      const model = await this.getModel("text");
      const response = await model.invoke(prompt);

      // LangChain ChatOpenAI always returns a message object
      if ((response as any)?.content) {
        return typeof response.content === "string"
          ? response.content
          : JSON.stringify(response.content);
      }

      return "Missing files detected. Review recent changes and update or restore the plan.";
    } catch (error) {
      console.error("[AiService] analyzeDrift error:", error);
      return "Unable to analyze drift automatically. Please review missing files manually.";
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
      console.error("[AiService] Failed to save context:", error);
    }
  }

  private fallbackText(message: string): AiPayload {
    return {
      type: "TEXT",
      message,
      data: undefined,
    };
  }
}

export const aiService = new AiService();
