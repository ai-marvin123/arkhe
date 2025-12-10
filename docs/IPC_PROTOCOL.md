# 🔌 IPC Protocol: Frontend ↔ Backend (v2)

**Core:** Async Message Passing. Shared `sessionId`.

---

## 1\. Shared Data Structures

### `StructureNode`

Project item schema.

| Key        | Type                 | Description            |
| :--------- | :------------------- | :--------------------- |
| `id`       | `string`             | Unique ID.             |
| `label`    | `string`             | Display name.          |
| `type`     | `'FILE' \| 'FOLDER'` | UI Icon.               |
| `level`    | `number`             | Depth.                 |
| `path`     | `string`             | Relative path.         |
| `parentId` | `string?`            | Parent ID.             |
| `status`   | `DriftStatus?`       | **(NEW)** Drift state. |

### `DriftStatus` (Enum)

| Value       | Color (UI)    | Meaning                     |
| :---------- | :------------ | :-------------------------- |
| `MATCHED`   | Green/Default | Exists in Plan & Disk.      |
| `MISSING`   | Red           | In Plan, NOT on Disk.       |
| `UNTRACKED` | Gray          | NOT in Plan, Found on Disk. |

### `StructureEdge`

| Key      | Type     | Description |
| :------- | :------- | :---------- |
| `source` | `string` | Parent ID.  |
| `target` | `string` | Child ID.   |

---

## 2\. Frontend → Backend (Commands)

_Direction: UI triggers Backend._

### A. Generation & Session

| Command              | Payload               | Action                       |
| :------------------- | :-------------------- | :--------------------------- |
| `GENERATE_STRUCTURE` | `{sessionId, prompt}` | Calls AI to build/edit plan. |
| `RESET_SESSION`      | `{sessionId}`         | Clears history.              |

### B. Persistence (Filesystem)

| Command     | Payload                    | Action                                                   |
| :---------- | :------------------------- | :------------------------------------------------------- |
| `SAVE_PLAN` | `{sessionId, diagramData}` | Overwrites `.repoplan.json`.                             |
| `LOAD_PLAN` | `{sessionId}`              | Checks `.repoplan.json`. Returns Diagram or "Not Found". |

### C. Drift Detection

| Command          | Payload       | Action                                                                |
| :--------------- | :------------ | :-------------------------------------------------------------------- |
| `CHECK_DRIFT`    | `{sessionId}` | Scans disk, compares to plan. Returns colored Diagram.                |
| `SYNC_TO_ACTUAL` | `{sessionId}` | Overwrites Plan with Disk reality. Saves file. Returns clean Diagram. |

---

## 3\. Backend → Frontend (Events)

_Direction: Backend updates UI._

### A. `AI_RESPONSE`

Universal data carrier for Chat, Diagrams, and Drift Results.

| Type      | Payload           | Context                                             |
| :-------- | :---------------- | :-------------------------------------------------- |
| `TEXT`    | `{message}`       | Chat response / Errors / "No Plan Found".           |
| `DIAGRAM` | `{message, data}` | Gen result / Load success / Drift result (colored). |

### B. Status

| Command             | Payload     | Values                                         |
| :------------------ | :---------- | :--------------------------------------------- |
| `PROCESSING_STATUS` | `{step}`    | `analyzing`, `generating`, `scanning`, `done`. |
| `ERROR`             | `{message}` | Critical failures.                             |

---

## 4\. TypeScript Implementation (Updated)

```typescript
// --- 1. Shared Data Models ---

export type DriftStatus = 'MATCHED' | 'MISSING' | 'UNTRACKED';

export interface StructureNode {
  id?: string;
  label: string;
  type: 'FILE' | 'FOLDER';
  level: number;
  path: string;
  parentId?: string;
  status?: DriftStatus; // Added
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
  // Gen
  | {
      command: 'GENERATE_STRUCTURE';
      payload: { sessionId: string; prompt: string };
    }
  | { command: 'RESET_SESSION'; payload: { sessionId: string } }
  // Persistence
  | {
      command: 'SAVE_PLAN';
      payload: { sessionId: string; diagramData: DiagramData };
    }
  | { command: 'LOAD_PLAN'; payload: { sessionId: string } }
  // Drift
  | { command: 'CHECK_DRIFT'; payload: { sessionId: string } }
  | { command: 'SYNC_TO_ACTUAL'; payload: { sessionId: string } };

export type BackendMessage =
  | { command: 'AI_RESPONSE'; payload: AiResponsePayload }
  | {
      command: 'PROCESSING_STATUS';
      payload: { step: 'analyzing' | 'generating' | 'scanning' | 'done' };
    }
  | { command: 'ERROR'; payload: { message: string } };
```
