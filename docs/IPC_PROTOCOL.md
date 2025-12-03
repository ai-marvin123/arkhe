# 🔌 IPC Protocol: Frontend ↔ Backend

**Definition:** Defines the JSON message contract between the React Webview (Frontend) and the VS Code Extension Host (Backend).

**Core Principle:**

- **Architecture:** Asynchronous Message Passing.
- **Context:** The **Backend** maintains the LLM conversation history mapped by a **`sessionId`**. The Frontend generates and manages this ID (e.g., using `crypto.randomUUID()`).

## 1. Shared Data Structures

These structures define the payload format for file trees.

### `StructureNode`

Represents a single item in the project structure (can be a file or a folder).

```typescript
interface StructureNode {
  id: string; // Unique ID (e.g., "src-components-button")
  label: string; // Display name (e.g., "Button.tsx")
  type: 'file' | 'folder'; // Determines icon (Paper vs Folder)
  level: number; // Hierarchy depth (0, 1, 2...) for coloring
  path: string; // Relative path (e.g., "/src/components/Button.tsx")
  parentId?: string; // (Optional) ID of the parent folder
}
```

### `StructureEdge`

Represents the hierarchical relationship between nodes.

```typescript
interface StructureEdge {
  source: string; // ID of the parent node
  target: string; // ID of the child node
}
```

## 2\. Frontend → Backend (Commands)

_Direction: User Interface triggers Backend actions._

| Command                  | Payload                                     | Description                                                                                                                    |
| :----------------------- | :------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------- |
| **`GENERATE_STRUCTURE`** | `{ "sessionId": string, "prompt": string }` | **Updated:** Includes `sessionId`. Backend uses this ID to retrieve or create the conversation history context.                |
| **`RESET_SESSION`**      | `{ "sessionId": string }`                   | Explicitly tells Backend to delete history for this ID (Memory cleanup). Frontend should generate a NEW ID after sending this. |

#### Example Request:

```json
{
  "command": "GENERATE_STRUCTURE",
  "payload": {
    "sessionId": "uuid-v4-123456789",
    "prompt": "Add a Redux store folder to the previous structure"
  }
}
```

## 3\. Backend → Frontend (Events)

_Direction: Backend updates the UI._

| Command                   | Payload                                                                                                | Description                                                        |
| :------------------------ | :----------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------- | --------- | ------------------------- |
| **`STRUCTURE_GENERATED`** | `{ "mermaidSyntax": string, "jsonStructure": { "nodes": StructureNode[], "edges": StructureEdge[] } }` | Successful generation. Frontend redraws the graph using this data. |
| **`PROCESSING_STATUS`**   | `{ "step": "analyzing"                                                                                 | "generating"                                                       | "done" }` | Updates UI loading state. |
| **`ERROR`**               | `{ "message": string }`                                                                                | LLM failure or parsing error.                                      |

#### Example Response (`STRUCTURE_GENERATED`):

```json
{
  "command": "STRUCTURE_GENERATED",
  "payload": {
    "mermaidSyntax": "graph TD; root-->src;",
    "jsonStructure": {
      "nodes": [
        {
          "id": "root",
          "label": "root",
          "type": "folder",
          "level": 0,
          "path": "/"
        },
        {
          "id": "src",
          "label": "src",
          "type": "folder",
          "level": 1,
          "path": "/src"
        }
      ],
      "edges": [{ "source": "root", "target": "src" }]
    }
  }
}
```

## 4\. TypeScript Implementation (Draft)

_Note: Frontend usage is optional but recommended for type safety._

Use these types in `src/types.ts` (Backend) and optionally in `webview-ui/src/types.ts` (Frontend).

```typescript
// --- Shared Types ---

export interface StructureNode {
  id: string;
  label: string;
  type: 'file' | 'folder';
  level: number;
  path: string;
  parentId?: string;
}

export interface StructureEdge {
  source: string;
  target: string;
}

// --- Message Types ---

export type FrontendMessage =
  | {
      command: 'GENERATE_STRUCTURE';
      payload: { sessionId: string; prompt: string };
    }
  | { command: 'RESET_SESSION'; payload: { sessionId: string } };

export type BackendMessage =
  | {
      command: 'STRUCTURE_GENERATED';
      payload: {
        mermaidSyntax: string;
        jsonStructure: { nodes: StructureNode[]; edges: StructureEdge[] };
      };
    }
  | {
      command: 'PROCESSING_STATUS';
      payload: { step: 'analyzing' | 'generating' | 'done' };
    }
  | { command: 'ERROR'; payload: { message: string } };
```
