# 🔌 IPC Protocol: Frontend ↔ Backend (v4)

**Core:** Async Message Passing. Shared `sessionId`.

---

## 1\. Shared Data Structures

### `StructureNode`

Project item schema.

| Key        | Type                 | Description                              |
| :--------- | :------------------- | :--------------------------------------- |
| `id`       | `string`             | **Plan:** UUID. **Disk:** Relative Path. |
| `label`    | `string`             | Display name.                            |
| `type`     | `'FILE' \| 'FOLDER'` | UI Icon.                                 |
| `path`     | `string`             | Relative path.                           |
| `parentId` | `string?`            | Parent ID.                               |
| `status`   | `DriftStatus?`       | **(NEW)** Drift state.                   |

### `DriftStatus` (Enum)

| Value       | Color (UI) | Meaning                     |
| :---------- | :--------- | :-------------------------- |
| `MATCHED`   | Green      | Exists in Plan & Disk.      |
| `MISSING`   | Red        | In Plan, NOT on Disk.       |
| `UNTRACKED` | Gray       | NOT in Plan, Found on Disk. |

---

## 2\. Frontend → Backend (Commands)

_Direction: UI triggers Backend._

### A. Generation

| Command              | Payload               | Action                          |
| :------------------- | :-------------------- | :------------------------------ |
| `GENERATE_STRUCTURE` | `{sessionId, prompt}` | Calls AI to build/edit diagram. |
| `RESET_SESSION`      | `{sessionId}`         | Clears history.                 |

### B. Persistence

| Command        | Payload                    | Action                       |
| :------------- | :------------------------- | :--------------------------- |
| `SAVE_DIAGRAM` | `{sessionId, diagramData}` | Overwrites `.repoplan.json`. |
| `LOAD_DIAGRAM` | `{sessionId}`              | Checks `.repoplan.json`.     |

### C. Drift Detection

| Command          | Payload       | Action                             |
| :--------------- | :------------ | :--------------------------------- |
| `CHECK_DRIFT`    | `{sessionId}` | Scans disk, diffs with plan.       |
| `SYNC_TO_ACTUAL` | `{sessionId}` | Overwrites Plan with Disk reality. |

---

## 3\. Backend → Frontend (Events)

_Direction: Backend updates UI._

### `AI_RESPONSE` Types

Universal data carrier.

| Type                | Payload           | Context                                    |
| :------------------ | :---------------- | :----------------------------------------- |
| `TEXT`              | `{message}`       | Chat / Errors.                             |
| `DIAGRAM`           | `{message, data}` | Gen result / Load success / Sync success.  |
| `DIAGRAM_SAVED`     | `{message}`       | Save confirmation.                         |
| `NO_SAVED_DIAGRAM`  | `{message}`       | Load failed (Trigger New Chat UI).         |
| `ALL_MATCHED`       | `{message}`       | **Drift:** Perfect sync (Case 2.1).        |
| `MISSING_DIAGRAM`   | `{message, data}` | **Drift:** Plan has items missing on Disk. |
| `UNTRACKED_DIAGRAM` | `{message, data}` | **Drift:** Disk has new items not in Plan. |

### Errors

| Command | Payload     | Context            |
| :------ | :---------- | :----------------- |
| `ERROR` | `{message}` | Critical failures. |

---

## 4\. TypeScript Implementation

```typescript
// --- 1. Shared Data Models ---

export type DriftStatus = 'MATCHED' | 'MISSING' | 'UNTRACKED';

export interface StructureNode {
  id: string; // Plan: UUID, Actual: RelativePath
  label: string;
  type: 'FILE' | 'FOLDER';
  path: string;
  parentId?: string;
  status?: DriftStatus;
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
  // Standard Text / Chat
  | { type: 'TEXT'; message: string; data?: never }

  // Standard Diagram Operations
  | { type: 'DIAGRAM'; message: string; data: DiagramData }
  | { type: 'DIAGRAM_SAVED'; message: string }
  | { type: 'NO_SAVED_DIAGRAM'; message: string }

  // --- DRIFT RESULTS (New Scenarios) ---

  // Case 2.1: Perfect Match
  | {
      type: 'ALL_MATCHED';
      message: string;
    }

  // Case 2.2: Missing Files (Contains AI Analysis)
  | {
      type: 'MISSING_DIAGRAM';
      message: string;
      data: DiagramData; // Nodes + Edges (Matched + Missing)
    }

  // Case 2.3: Untracked Files (Static Message)
  | {
      type: 'UNTRACKED_DIAGRAM';
      message: string;
      data: DiagramData; // Nodes + Edges (Matched + Untracked)
    };

  // Case 2.4: Mixed diagram
  | {
    type: 'MIXED_DIAGRAM';
    message: string;             // AI Message cho phần Missing
    missingDiagramData: DiagramData;   // Data vẽ cây đỏ
    untrackedDiagramData: DiagramData; // Data vẽ cây xám
  };

// --- 3. VS Code Message Definitions ---

export type MessageToBackend =
  // Gen
  | {
      command: 'GENERATE_STRUCTURE';
      payload: { sessionId: string; prompt: string };
    }
  | { command: 'RESET_SESSION'; payload: { sessionId: string } }
  // Persistence
  | {
      command: 'SAVE_DIAGRAM';
      payload: { sessionId: string; diagramData: DiagramData };
    }
  | { command: 'LOAD_DIAGRAM'; payload: { sessionId: string } }
  // Drift
  | { command: 'CHECK_DRIFT'; payload: { sessionId: string } }
  | { command: 'SYNC_TO_ACTUAL'; payload: { sessionId: string } };

export type MessageToFrontend =
  | { command: 'AI_RESPONSE'; payload: AiPayload }
  | { command: 'ERROR'; payload: { message: string } };
```
