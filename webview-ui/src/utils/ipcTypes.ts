import type { DiagramData } from '../state/diagramTypes';

export type AiPayload =
  | { type: 'TEXT'; message: string; data?: never }
  | { type: 'DIAGRAM'; message: string; data: DiagramData };

export type MessageToFrontend = {
  command: 'AI_RESPONSE';
  payload: AiPayload;
};

export type LoadSavedDiagramResponse =
  | {
      command: 'AI_RESPONSE';
      payload: {
        type: 'DIAGRAM';
        message: string;
        data: DiagramData;
      };
    }
  | {
      command: 'AI_RESPONSE';
      payload: { type: 'NO_SAVED_DIAGRAM'; message: string };
    }
  | {
      command: 'ERROR';
      payload: { message: string };
    };

export type SaveResponse =
  | {
      command: 'AI_RESPONSE';
      payload: {
        type: string;
        message: string;
      };
    }
  | {
      command: 'ERROR';
      payload: { message: string };
    };
