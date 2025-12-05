import { z } from "zod";
import { JsonStructureSchema } from "./JsonStructureSchema"; 

export const AiResponseSchema = z.object({
  mermaidSyntax: z.string(),
  jsonStructure: JsonStructureSchema,
});

export type AiResponseType = z.infer<typeof AiResponseSchema>;