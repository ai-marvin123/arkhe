# 🔌 IPC Protocol: Frontend ↔ Backend

**Definition:** Message contract between React Webview (Frontend) and Extension Host (Backend).

**Core Principle:**

- **Architecture:** Async Message Passing.
- **Context:** Backend maintains history by `sessionId`. Frontend manages this ID.

---

## 1. Shared Data Structures

Schema for file tree data.

### `StructureNode`

Represents a project item.

| Key        | Type                 | Description                     |
| :--------- | :------------------- | :------------------------------ |
| `id`       | `string`             | Unique ID (e.g., "src-btn").    |
| `label`    | `string`             | Display name (e.g., "App.tsx"). |
| `type`     | `'FILE' \| 'FOLDER'` | UI Icon type (Upper case).      |
| `level`    | `number`             | Depth (0, 1, 2) for styling.    |
| `path`     | `string`             | Relative path for actions.      |
| `parentId` | `string?`            | (Optional) Parent Node ID.      |

### `StructureEdge`

Represents hierarchy.

| Key      | Type     | Description     |
| :------- | :------- | :-------------- |
| `source` | `string` | Parent Node ID. |
| `target` | `string` | Child Node ID.  |

---

## 2. Frontend → Backend (Commands)

_Direction: UI triggers Backend._

| Command              | Payload               | Description                 |
| :------------------- | :-------------------- | :-------------------------- |
| `GENERATE_STRUCTURE` | `{sessionId, prompt}` | Sends prompt & triggers AI. |
| `RESET_SESSION`      | `{sessionId}`         | Clears backend history.     |

#### Example Request:

```json
{
  "command": "GENERATE_STRUCTURE",
  "payload": {
    "sessionId": "uuid-v4-12345",
    "prompt": "Create NestJS structure"
  }
}
```

---

## 3\. Backend → Frontend (Events)

_Direction: Backend updates UI._

### A. The Wrapper (`AI_RESPONSE`)

Standard response for Chat & Diagrams.

| Key       | Type                  | Description                        |
| :-------- | :-------------------- | :--------------------------------- |
| `type`    | `'TEXT' \| 'DIAGRAM'` | Controls UI mode.                  |
| `message` | `string`              | AI text explanation.               |
| `data`    | `object?`             | Diagram payload (if type=DIAGRAM). |

#### Example 1: Text Only

```json
{
  "command": "AI_RESPONSE",
  "payload": {
    "type": "TEXT",
    "message": "Please clarify?",
    "data": null
  }
}
```

#### Example 2: Diagram

```json
{
  "command": "AI_RESPONSE",
  "payload": {
    "type": "DIAGRAM",
    "message": "Done.",
    "data": {
      "mermaidSyntax": "graph TD...",
      "jsonStructure": { "nodes": [], "edges": [] }
    }
  }
}
```

### B. Other Events

| Command             | Payload     | Description            |
| :------------------ | :---------- | :--------------------- | ------------ | ------ |
| `PROCESSING_STATUS` | `{step}`    | `analyzing`            | `generating` | `done` |
| `ERROR`             | `{message}` | System/Parsing errors. |

---

## 4\. TypeScript Implementation

Copy to `src/types.ts` (Backend) and `webview-ui/src/types.ts` (Frontend).

```typescript
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

export type AiPayload =
  | { type: 'TEXT'; message: string; data?: never }
  | { type: 'DIAGRAM'; message: string; data: DiagramData };

// --- 3. VS Code Message Definitions ---

//what FE sends to BE
export type FrontendMessage =
  | {
      command: 'GENERATE_STRUCTURE';
      payload: { sessionId: string; prompt: string };
    }
  | { command: 'RESET_SESSION'; payload: { sessionId: string } };

//what BE sends to FE
export type MessageToFrontend =
  | { command: 'AI_RESPONSE'; payload: AiPayload }
  | {
      command: 'PROCESSING_STATUS';
      payload: { step: 'analyzing' | 'generating' | 'done' };
    }
  | { command: 'ERROR'; payload: { message: string } };
```
