# 🌊 Drift Detection Workflow (Feature 2) - v2

**Context:** Interaction flow between Frontend (Webview) and Backend (Extension) for saving plans, detecting drift, and syncing with the actual repository.

---

### 1. User Saves Diagram

**Trigger:** User clicks "Save" after generating a satisfactory diagram.

**FE → BE:**

```json
{
  "command": "SAVE_DIAGRAM",
  "payload": {
    "sessionId": "sess-001",
    "diagramData": { ... } // Current full JSON structure
  }
}
```

**BE → FE:**

```json
{
  "command": "AI_RESPONSE",
  "payload": {
    "type": "DIAGRAM_SAVED",
    "message": "Diagram saved successfully."
  }
}
```

---

### 2\. App Startup (Load Diagram)

**Trigger:** User opens the extension. Frontend always checks for existing plans.

**FE → BE:**

```json
{
  "command": "LOAD_DIAGRAM",
  "payload": { "sessionId": "sess-001" }
}
```

**BE → FE (Scenario A: Diagram Exists):**

```json
{
  "command": "AI_RESPONSE",
  "payload": {
    "type": "DIAGRAM",
    "message": "Diagram loaded.",
    "data": { ... } // Content from .repoplan.json
  }
}
```

**BE → FE (Scenario B: No Diagram):**

```json
{
  "command": "AI_RESPONSE",
  "payload": {
    "type": "NO_SAVED_DIAGRAM",
    "message": "No diagram found."
  }
}
```

_(Frontend creates UI for new chat/generation)_

---

### 3\. Trigger Drift Check

**Trigger:** Frontend displays "Would you like to run a check against your repo?". User clicks **Yes**.

**FE → BE:**

```json
{
  "command": "CHECK_DRIFT",
  "payload": { "sessionId": "sess-001" }
}
```

---

### 4\. Return Drift Results (Updated Logic)

**Trigger:** Backend finishes scanning and comparison. It determines one of the following scenarios:

#### **Scenario 2.1: Perfect Match (All Matched)**

**BE → FE:**

```json
{
  "command": "AI_RESPONSE",
  "payload": {
    "type": "ALL_MATCHED",
    "message": "✅ Structure is perfectly synced with the codebase."
  }
}
```

#### **Scenario 2.2: Missing Files Detected**

_Files exist in Plan but NOT on Disk._

**BE → FE:**

```json
{
  "command": "AI_RESPONSE",
  "payload": {
    "type": "MISSING_DIAGRAM",
    "message": "⚠️ Analysis: 'User.ts' is missing. You might have renamed it. Solution: Update plan.",
    "data": {
      "mermaidSyntax": "graph TD; ...",
      "jsonStructure": {
        "nodes": [
          { "id": "1", "label": "App.tsx", "status": "MATCHED" },
          { "id": "2", "label": "User.ts", "status": "MISSING" }
        ],
        "edges": [...]
      }
    }
  }
}
```

#### **Scenario 2.3: Untracked Files Detected**

_New files found on Disk NOT in Plan._

**BE → FE:**

```json
{
  "command": "AI_RESPONSE",
  "payload": {
    "type": "UNTRACKED_DIAGRAM",
    "message": "ℹ️ Found new untracked files in your repository.",
    "data": {
      "mermaidSyntax": "graph TD; ...",
      "jsonStructure": {
        "nodes": [
          { "id": "1", "label": "App.tsx", "status": "MATCHED" },
          { "id": "3", "label": "NewHelper.ts", "status": "UNTRACKED" }
        ],
        "edges": [...]
      }
    }
  }
}
```

#### **Scenario 2.4: Mixed (Missing & Untracked)**

_Backend sends TWO messages sequentially._

1.  **Message 1:** Sends `MISSING_DIAGRAM` (Same format as Scenario 2.2).
2.  **Message 2:** Sends `UNTRACKED_DIAGRAM` (Same format as Scenario 2.3).

---

### 5\. Sync to Actual

**Trigger:** Frontend displays "Would you like to update your diagram to match your current repo?". User clicks **Yes**.

**FE → BE:**

```json
{
  "command": "SYNC_TO_ACTUAL",
  "payload": { "sessionId": "sess-001" }
}
```

---

### 6\. Update Complete

**Trigger:** Backend overwrites the diagram with actual repo structure and saves the file.

**BE → FE:**

```json
{
  "command": "AI_RESPONSE",
  "payload": {
    "type": "DIAGRAM",
    "message": "Diagram updated to match repository.",
    "data": {
      "mermaidSyntax": "...",
      "jsonStructure": {
        // All nodes are now synchronized
        "nodes": [ ... ],
        "edges": [ ... ]
      }
    }
  }
}
```

---

### 7\. Edit Mode

**Trigger:** Frontend displays "Would you like to edit your diagram?". User clicks **Yes**.

**FE Action:** Enables Chat Input and user can edit as the feature 1.

```

```
