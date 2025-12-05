// --- 1. Shared Data Models ---

export interface StructureNode {
  id: string;
  label: string;
  type: 'FILE' | 'FOLDER';
  level: number;
  path: string;
  parentId?: string;
}

export interface StructureEdge {
  source: string;
  target: string;
}

export interface DiagramData {
  mermaidSyntax: string;
  jsonStructure: {
    nodes: StructureNode[];
    edges: StructureEdge[];
  };
}

// --- 2. Message Payloads ---

export type AiResponsePayload =
  | { type: 'TEXT'; message: string; data?: never }
  | { type: 'DIAGRAM'; message: string; data: DiagramData };

// --- 3. VS Code Message Definitions ---

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
