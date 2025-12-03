import { ChatOpenAI } from "@langchain/openai";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { WrapperSchema } from "../schema";          
import type { WrapperType } from "../schema";       

// ---------------------------
// 1. Initialize LLM
// ---------------------------
const llm = new ChatOpenAI({
  model: "gpt-4.1-mini",
  temperature: 0,
  maxTokens: 2048,
});

// ---------------------------
// 2. Create a strict parser
// ---------------------------
const parser = new StructuredOutputParser(WrapperSchema);

// ---------------------------
// 3. System prompt (clean + strict)
// ---------------------------
const SYSTEM_PROMPT = `
You are an AI architecture generator.

Always return output in this exact JSON structure:

${parser.getFormatInstructions()}

Rules:
- If user input is not enough for a diagram, return:
  { "type": "TEXT", "message": "Please clarify ..." }

- If user input describes a system, return:
  {
    "type": "DIAGRAM",
    "message": "...",
    "data": {
      "mermaidSyntax": "...",
      "jsonStructure": {
        "nodes": [...],
        "edges": [...]
      }
    }
  }

Node IDs must be valid strings.
Use () for rounded rectangles in Mermaid.
`;

// ---------------------------
// 4. Main callable function
// ---------------------------
export async function generateDiagramFromText(
  userInput: string
): Promise<WrapperType> {
  try {
    const raw = await llm.invoke([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userInput }
    ]);

    // raw is a ChatMessage; extract plain string
    const textOutput =
      typeof raw === "string"
        ? raw
        : raw.content ??
          raw.text ??
          JSON.stringify(raw);

    // Validate & return strict JSON
    return parser.parse(textOutput);
  } catch (err) {
    console.error("AI Parse Error:", err);

    return {
      type: "TEXT",
      message: "AI could not generate a valid diagram. Please try again.",
    };
  }
}
