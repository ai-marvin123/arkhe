# 🌊 Step 4: Return Drift Results (Detailed Flow)

**Context:** This document outlines the refined logic for handling Drift Detection results.
**Goal:** Improve User Experience (UX) by providing immediate visual feedback (Split View) while asynchronously fetching AI insights.

---

## 1. Logic Overview

Instead of sending a single "mixed" JSON response, the Backend will split the response into **two distinct phases**:

### **Phase A: Immediate Data (Synchronous)**

**Goal:** Render the UI immediately without waiting for AI.
The Backend compares the **Plan** vs. **Actual File System** and returns **two separate JSON structures** in a single message:

1.  **Plan View:** Contains `MATCHED` and `MISSING` nodes. (What _should_ be there).
2.  **Actual View:** Contains `MATCHED` and `UNTRACKED` nodes. (What _is_ actually there).

### **Phase B: AI Analysis (Asynchronous)**

**Goal:** Provide intelligent insights (e.g., detecting renamed files, typos, or structural changes).
After sending Phase A, the Backend privately invokes the LLM with the list of _Missing_ and _Untracked_ files. Once the AI responds, the Backend pushes a second message to the Frontend.

---

## 2. Interaction Flow

| Step    | Actor    | Action                                                                            | Payload Type       |
| :------ | :------- | :-------------------------------------------------------------------------------- | :----------------- |
| **3.0** | Frontend | User clicks "Check Drift". Sends `CHECK_DRIFT` command.                           | `MessageToBackend` |
| **4.1** | Backend  | Scans files, calculates drift. **Immediately** sends separate Plan & Actual data. | `DRIFT_DATA`       |
| **4.2** | Frontend | Renders "Split View" (Left: Plan, Right: Actual). User sees results instantly.    | -                  |
| **4.3** | Backend  | (Background) Sends diff to LLM for analysis. Waits for response.                  | -                  |
| **4.4** | Backend  | LLM finishes. Backend sends analysis text to Frontend.                            | `DRIFT_ANALYSIS`   |
| **4.5** | Frontend | Displays toast/notification or insight banner with the AI message.                | -                  |

---

## 3. IPC Protocol Definitions (TypeScript)

Update `src/types/index.ts` with the following definitions:

### A. New Payload Types

```typescript
import { DiagramData } from './index';

// Payload for Phase A (Immediate)
export type DriftDataPayload = {
  planView: DiagramData; // Nodes with status: 'MATCHED' | 'MISSING'
  actualView: DiagramData; // Nodes with status: 'MATCHED' | 'UNTRACKED'
};

// Payload for Phase B (Async Analysis)
export type DriftAnalysisPayload = {
  message: string; // Combined insight and suggestion from AI
};
```

### B. Updated Message Protocols

```typescript
// Message from Backend to Frontend
export type MessageToFrontend =
  // ... existing messages (AI_RESPONSE, ERROR) ...

  // 1. FAST: Immediate Drift Data
  | {
      command: 'DRIFT_DATA';
      payload: DriftDataPayload;
    }

  // 2. SLOW: AI Analysis Result
  | {
      command: 'DRIFT_ANALYSIS';
      payload: DriftAnalysisPayload;
    };
```

---

## 4\. Example JSON Payloads

### Phase A: `DRIFT_DATA` (Immediate)

_Sent \~100ms after request._

```json
{
  "command": "DRIFT_DATA",
  "payload": {
    "planView": {
      "mermaidSyntax": "...",
      "jsonStructure": {
        "nodes": [
          { "id": "1", "label": "App.tsx", "status": "MATCHED" },
          { "id": "2", "label": "User.ts", "status": "MISSING" }
        ],
        "edges": [...]
      }
    },
    "actualView": {
      "mermaidSyntax": "...",
      "jsonStructure": {
        "nodes": [
          { "id": "1", "label": "App.tsx", "status": "MATCHED" },
          { "id": "3", "label": "Users.ts", "status": "UNTRACKED" }
        ],
        "edges": [...]
      }
    }
  }
}
```

### Phase B: `DRIFT_ANALYSIS` (Async)

_Sent \~2-3 seconds after request._

```json
{
  "command": "DRIFT_ANALYSIS",
  "payload": {
    "message": "Drift Detected: It appears 'User.ts' was renamed to 'Users.ts'. Consider updating the plan to match the new filename."
  }
}
```
