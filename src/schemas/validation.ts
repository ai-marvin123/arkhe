import { AiResponsePayload } from "../types";

/**
 * Validates model output matches AiResponsePayload structure.
 */
export function validateAiResponse(output: any): {
  success: boolean;
  data?: AiResponsePayload;
} {
  if (!output || typeof output !== "object") {
    return { success: false };
  }

  if (!("type" in output) || !("message" in output)) {
    return { success: false };
  }

  if (output.type === "TEXT") {
    return {
      success: true,
      data: {
        type: "TEXT",
        message: output.message,
      },
    };
  }

  if (output.type === "DIAGRAM") {
    const data = output.data;
    if (
      data &&
      typeof data.mermaidSyntax === "string" &&
      data.jsonStructure &&
      Array.isArray(data.jsonStructure.nodes) &&
      Array.isArray(data.jsonStructure.edges)
    ) {
      return {
        success: true,
        data: output as AiResponsePayload,
      };
    }
  }

  return { success: false };
}
