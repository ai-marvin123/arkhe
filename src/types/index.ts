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

  // --- E. DRIFT SCENARIOS (UPDATED) ---

  // E1. All Matched
  z
    .object({
      type: z.literal('ALL_MATCHED'),
      message: z.string(),
    })
    .strict(),

  // E2. Missing Only
  z
    .object({
      type: z.literal('MISSING_DIAGRAM'),
      message: z.string(),
      data: DiagramDataSchema,
    })
    .strict(),

  // E3. Untracked Only
  z
    .object({
      type: z.literal('UNTRACKED_DIAGRAM'),
      message: z.string(),
      data: DiagramDataSchema,
    })
    .strict(),

  // E4. Mixed (Both Missing & Untracked) - NEW 🔥
  z
    .object({
      type: z.literal('MIXED_DIAGRAM'),
      message: z.string(), // AI Message
      missingDiagramData: DiagramDataSchema,
      untrackedDiagramData: DiagramDataSchema,
    })
    .strict(),
]);

// --- 3. TYPESCRIPT INTERFACES ---

export type DriftStatus = z.infer<typeof DriftStatusSchema>;
export type JsonStructure = z.infer<typeof JsonStructureSchema>;
export type StructureNode = z.infer<typeof StructureNodeSchema>;
export type StructureEdge = z.infer<typeof EdgeSchema>;
export type DiagramData = z.infer<typeof DiagramDataSchema>;
export type AiPayload = z.infer<typeof AiPayloadSchema>; // Renamed from AiResponsePayload

// --- 4. MESSAGE PROTOCOLS (Frontend <-> Backend) ---

export type MessageToBackend =
  | { command: 'GENERATE_STRUCTURE'; payload: { sessionId: string; prompt: string } }
  | { command: 'RESET_SESSION'; payload: { sessionId: string } }
  | { command: 'SAVE_DIAGRAM'; payload: { sessionId: string; diagramData: any } }
  | { command: 'LOAD_DIAGRAM'; payload: { sessionId: string } }
  | { command: 'CHECK_DRIFT'; payload: { sessionId: string } }
  | { command: 'SYNC_TO_ACTUAL'; payload: { sessionId: string } }

  // ✅ NEW
  | { command: 'GET_SETTINGS'; payload: { sessionId: string } }
  | {
      command: 'SAVE_SETTINGS';
      payload: {
        sessionId: string;
        apiKey?: string;
        provider: string;
        model: string;
      };
    };


export type MessageToFrontend = // Renamed from BackendMessage

    | { command: 'AI_RESPONSE'; payload: AiPayload }
    | { command: 'ERROR'; payload: { message: string } };
