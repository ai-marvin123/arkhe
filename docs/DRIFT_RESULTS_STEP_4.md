# 🌊 Step 4: Return Drift Results (Logic Update)

**Context:** Handling Drift Detection results based on specific scenarios (Matched, Missing, Untracked).
**Goal:** Categorize drift results into 4 distinct cases and send targeted responses to the Frontend.

---

## 1. Logic Overview

Upon receiving the `CHECK_DRIFT` command, the Backend analyzes the file system against the plan and handles **4 specific scenarios**:

| Scenario | Condition                                     | Action                                                                                                                  |
| :------- | :-------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------- |
| **2.1**  | **All Matched**<br>(No missing, no untracked) | Send **1 message** (`ALL_MATCHED`).                                                                                     |
| **2.2**  | **Matched + Missing**<br>(No untracked)       | Send **1 message** (`MISSING_DIAGRAM`).<br>Includes **AI analysis** (cause/solution).                                   |
| **2.3**  | **Matched + Untracked**<br>(No missing)       | Send **1 message** (`UNTRACKED_DIAGRAM`).<br>Includes a **fixed/static** message.                                       |
| **2.4**  | **Mixed**<br>(Both missing & untracked)       | Send **2 messages** sequentially:<br>1. `MISSING_DIAGRAM` (with AI analysis)<br>2. `UNTRACKED_DIAGRAM` (static message) |

---

## 2. Interaction Flow

| Step    | Actor    | Action                                                                | Payload Type                                            |
| :------ | :------- | :-------------------------------------------------------------------- | :------------------------------------------------------ |
| **3.0** | Frontend | User clicks "Check Drift". Sends `CHECK_DRIFT`.                       | `MessageToBackend`                                      |
| **4.0** | Backend  | Calculates drift and determines the scenario (2.1, 2.2, 2.3, or 2.4). | -                                                       |
| **4.1** | Backend  | Sends the corresponding `AI_RESPONSE` message(s).                     | `ALL_MATCHED` / `MISSING_DIAGRAM` / `UNTRACKED_DIAGRAM` |
| **4.2** | Frontend | Renders the UI based on the received message type.                    | -                                                       |

---

## 3. IPC Protocol Definitions (TypeScript)

Update `src/types/index.ts` with the new discriminated union types for `AiPayload`.

```typescript
import { DiagramData } from "./index";

export type AiPayload =
  // ... existing types (TEXT, DIAGRAM, etc.) ...

  // CASE 2.1: Perfect Match
  | {
      type: "ALL_MATCHED";
      message: string; // e.g., "Everything is in sync."
    }

  // CASE 2.2: Missing Files Detected
  // (Also used as the 1st message in CASE 2.4)
  | {
      type: "MISSING_DIAGRAM";
      message: string; // AI Generated Analysis (Cause & Solution)
      data: DiagramData; // Full structure (Nodes + Edges) containing 'MATCHED' and 'MISSING'
    }

  // CASE 2.3: Untracked Files Detected
  // (Also used as the 2nd message in CASE 2.4)
  | {
      type: "UNTRACKED_DIAGRAM";
      message: string; // Fixed static message (e.g., "New files detected.")
      data: DiagramData; // Full structure (Nodes + Edges) containing 'MATCHED' and 'UNTRACKED'
    };

// NOTE: CASE 2.4 (Mixed) does NOT need a new type.
// It simply sends a 'MISSING_DIAGRAM' message followed by an 'UNTRACKED_DIAGRAM' message.
```

---

## 4\. Example Payloads

### Case 2.1: All Matched

```json
{
  "command": "AI_RESPONSE",
  "payload": {
    "type": "ALL_MATCHED",
    "message": "Structure is perfectly synced with the codebase."
  }
}
```

### Case 2.2: Missing Nodes Only (AI Analysis Required)

```json
{
  "command": "AI_RESPONSE",
  "payload": {
    "type": "MISSING_DIAGRAM",
    "message": "Analysis: 'User.ts' is missing. You might have renamed it. Solution: Update plan.",
    "data": {
      "mermaidSyntax": "graph TD; ...",
      "jsonStructure": {
        "nodes": [
          /* Matched + Missing nodes */
        ],
        "edges": [
          /* Edges connecting them */
        ]
      }
    }
  }
}
```

### Case 2.3: Untracked Nodes Only (Static Message)

```json
{
  "command": "AI_RESPONSE",
  "payload": {
    "type": "UNTRACKED_DIAGRAM",
    "message": "Found new untracked files in your repository.",
    "data": {
      "mermaidSyntax": "graph TD; ...",
      "jsonStructure": {
        "nodes": [
          /* Matched + Untracked nodes */
        ],
        "edges": [
          /* Edges connecting them */
        ]
      }
    }
  }
}
```

### Case 2.4: Mixed (Both Types)

_The Backend sends two separate `postMessage` calls sequentially._

**Message 1:** (Payload similar to Case 2.2 - Analysis of missing files)
**Message 2:** (Payload similar to Case 2.3 - Notification of untracked files)
