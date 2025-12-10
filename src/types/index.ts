import { z } from 'zod';

// --- 1. Core Data Structures ---

// NEW: Drift Status Enum for Drift Detection Feature
export const DriftStatusSchema = z.enum(['MATCHED', 'MISSING', 'UNTRACKED']);

export const StructureNodeSchema = z.object({
  id: z.string(), // Required: Use UUID for Plan nodes, Relative Path for Disk nodes
  label: z.string(),
  type: z.enum(['FILE', 'FOLDER']),
  level: z.number(),
  path: z.string(),
  parentId: z.string().nullable().optional(),
  status: DriftStatusSchema.optional(), // NEW: Optional status for drift visualization
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

// --- 2. AI Response Wrapper (Discriminated Union) ---

export const AiResponseSchema = z.discriminatedUnion('type', [
  // Case 1: Text Response (Chat, Error message, Status info)
  z
    .object({
      type: z.literal('TEXT'),
      message: z.string(),
      data: z.undefined().nullable().optional(),
    })
    .strict(),

  // Case 2: Diagram Response (Gen result, Load result, Drift result)
  z
    .object({
      type: z.literal('DIAGRAM'),
      message: z.string(),
      data: DiagramDataSchema,
    })
    .strict(),
]);

// --- 3. TYPESCRIPT INTERFACES (Inferred from Schemas) ---

export type DriftStatus = z.infer<typeof DriftStatusSchema>;
export type StructureNode = z.infer<typeof StructureNodeSchema>;
export type StructureEdge = z.infer<typeof EdgeSchema>;
export type DiagramData = z.infer<typeof DiagramDataSchema>;
export type AiResponsePayload = z.infer<typeof AiResponseSchema>;

// --- 4. MESSAGE PROTOCOLS (Frontend <-> Backend) ---

export type FrontendMessage =
  // Group A: Generation & Session
  | {
      command: 'GENERATE_STRUCTURE';
      payload: { sessionId: string; prompt: string };
    }
  | {
      command: 'RESET_SESSION';
      payload: { sessionId: string };
    }
  // Group B: Persistence (Filesystem)
  | {
      command: 'SAVE_PLAN';
      payload: { sessionId: string; diagramData: DiagramData };
    }
  | {
      command: 'LOAD_PLAN';
      payload: { sessionId: string };
    }
  // Group C: Drift Detection
  | {
      command: 'CHECK_DRIFT';
      payload: { sessionId: string };
    }
  | {
      command: 'SYNC_TO_ACTUAL';
      payload: { sessionId: string };
    };

export type BackendMessage =
  | { command: 'AI_RESPONSE'; payload: AiResponsePayload }
  | {
      command: 'PROCESSING_STATUS';
      // Added 'scanning' for Drift Detection phase
      payload: { step: 'analyzing' | 'generating' | 'scanning' | 'done' };
    }
  | { command: 'ERROR'; payload: { message: string } };
