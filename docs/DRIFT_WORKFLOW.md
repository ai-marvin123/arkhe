# 🌊 Drift Detection Workflow (Feature 2)

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
    "type": "DIAGRAM_SAVED", // DIAGRAM_SAVED
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

### 4\. Return Drift Results

**Trigger:** Backend finishes scanning and comparison.

**BE → FE:**

```json
{
  "command": "AI_RESPONSE",
  "payload": {
    "type": "DRIFT_DIAGRAM",
    "message": "Drift check complete.",
    "data": {
      "mermaidSyntax": "...",
      "jsonStructure": {
        "nodes": [
          { "id": "1", "label": "Main.ts", "status": "MATCHED", ... },
          { "id": "2", "label": "Old.ts", "status": "MISSING", ... },    // In Plan, NOT on Disk
          { "id": "3", "label": "New.ts", "status": "UNTRACKED", ... }   // On Disk, NOT in Plan
          // if id is null -> id = path; parentId = parent folder.
        ],
        "edges": [...]
      }
    }
  }
}
```

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
