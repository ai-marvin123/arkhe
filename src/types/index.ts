import { z } from 'zod';

// --- 1. Core Data Structures ---

export const DriftStatusSchema = z.enum(['MATCHED', 'MISSING', 'UNTRACKED']);

export const StructureNodeSchema = z.object({
  id: z.string(), // Plan: UUID, Actual: RelativePath
  label: z.string(),
  type: z.enum(['FILE', 'FOLDER']),
  level: z.number(),
  path: z.string(),
  parentId: z.string().nullable().optional(),
  status: DriftStatusSchema.nullable().optional(), // Drift state
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

// --- 2. AI Payload Wrapper (Renamed from AiResponseSchema) ---

export const AiPayloadSchema = z.discriminatedUnion('type', [
  // A. Standard Chat/Text
  z
    .object({
      type: z.literal('TEXT'),
      message: z.string(),
      data: z.undefined().nullable().optional(),
    })
    .strict(),

  // B. Standard Diagram (Generation / Load Success / Sync Success)
  z
    .object({
      type: z.literal('DIAGRAM'),
      message: z.string(),
      data: DiagramDataSchema,
    })
    .strict(),

  // C. Save Success
  z
    .object({
      type: z.literal('DIAGRAM_SAVED'),
      message: z.string(),
    })
    .strict(),

  // D. Load Failed / No File
  z
    .object({
      type: z.literal('NO_SAVED_DIAGRAM'),
      message: z.string(),
    })
    .strict(),

  // E. Drift Result
  z
    .object({
      type: z.literal('DRIFT_DIAGRAM'),
      message: z.string(),
      data: DiagramDataSchema, // Nodes have 'status'
    })
    .strict(),
]);

// --- 3. TYPESCRIPT INTERFACES ---

export type DriftStatus = z.infer<typeof DriftStatusSchema>;
export type StructureNode = z.infer<typeof StructureNodeSchema>;
export type StructureEdge = z.infer<typeof EdgeSchema>;
export type DiagramData = z.infer<typeof DiagramDataSchema>;
export type AiPayload = z.infer<typeof AiPayloadSchema>; // Renamed from AiResponsePayload

// --- 4. MESSAGE PROTOCOLS (Frontend <-> Backend) ---

export type MessageToBackend = // Renamed from FrontendMessage
  // Group A: Generation & Session
  | {
      command: 'GENERATE_STRUCTURE';
      payload: { sessionId: string; prompt: string };
    }
  | {
      command: 'RESET_SESSION';
      payload: { sessionId: string };
    }
  // Group B: Persistence
  | {
      command: 'SAVE_DIAGRAM';
      payload: { sessionId: string; diagramData: DiagramData };
    }
  | {
      command: 'LOAD_DIAGRAM';
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

export type MessageToFrontend = // Renamed from BackendMessage

    | { command: 'AI_RESPONSE'; payload: AiPayload }
    | { command: 'ERROR'; payload: { message: string } };
