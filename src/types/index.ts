import { z } from 'zod';

// 1. Core Data Structures
export const StructureNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['FILE', 'FOLDER']),
  level: z.number(),
  path: z.string(),
  parentId: z.string().optional(),
});

export const EdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
});

export const JsonStructureSchema = z.object({
  nodes: z.array(StructureNodeSchema),
  edges: z.array(EdgeSchema),
});

export const DiagramDataSchema = z.object({
  mermaidSyntax: z.string(),
  jsonStructure: JsonStructureSchema,
});

// 2. AI Response Wrapper (Discriminated Union)
export const AiResponseSchema = z.discriminatedUnion('type', [
  // Case 1: Text Response (Chat, Error message)
  z
    .object({
      type: z.literal('TEXT'),
      message: z.string(),
      data: z.undefined().optional(),
    })
    .strict(),

  // Case 2: Diagram Response
  z
    .object({
      type: z.literal('DIAGRAM'),
      message: z.string(),
      data: DiagramDataSchema,
    })
    .strict(),
]);

// 3. TYPESCRIPT INTERFACES (Inferred from Schemas)

export type StructureNode = z.infer<typeof StructureNodeSchema>;
export type StructureEdge = z.infer<typeof EdgeSchema>;
export type DiagramData = z.infer<typeof DiagramDataSchema>;
export type AiResponsePayload = z.infer<typeof AiResponseSchema>;

// 4. MESSAGE PROTOCOLS (Frontend <-> Backend)

export type FrontendMessage =
  | {
      command: 'GENERATE_STRUCTURE';
      payload: { sessionId: string; prompt: string };
    }
  | { command: 'RESET_SESSION'; payload: { sessionId: string } };

export type BackendMessage =
  | { command: 'AI_RESPONSE'; payload: AiResponsePayload }
  | {
      command: 'PROCESSING_STATUS';
      payload: { step: 'analyzing' | 'generating' | 'done' };
    }
  | { command: 'ERROR'; payload: { message: string } };
