### **0. Backend Architecture Update**

We are adding two new services to handle file system operations and comparison logic.

```text
src/
├── types/
│   └── index.ts          # UPDATE: Renamed types, Added specific Drift payloads
├── services/
│   ├── AiService.ts      # UPDATE: Add method `analyzeDrift` for missing files
│   ├── FileService.ts    # NEW: Handles Save/Load .repoplan.json & Scanning Disk
│   └── DriftService.ts   # NEW: Logic for Comparing Diagram vs. Actual (Diffing)
├── handlers/
│   └── CommandHandler.ts # UPDATE: Handle new Drift scenarios (Split messages)
└── ...
```

---

### **Phase 1: Types & Persistence (Done)**

_(Matches previous plan - no changes needed)_

#### **Step 1.1: Update Shared Types**

- [x] **Update `src/types/index.ts`** (Reflect IPC Protocol v4):
  - Add Payload Types: `ALL_MATCHED`, `MISSING_DIAGRAM`, `UNTRACKED_DIAGRAM`.

#### **Step 1.2: Implement FileService (Persistence)**

- [x] **Create `src/services/FileService.ts`**:
  - Implement `saveDiagram` and `loadDiagram`.

#### **Step 1.3: Wiring Persistence Commands**

- [x] **Update `src/handlers/CommandHandler.ts`**:
  - Handle `SAVE_DIAGRAM` and `LOAD_DIAGRAM`.

---

### **Phase 2: Scanning & Drift Engine (Day 2)**

**Goal:** Implement disk scanning, drift calculation, AI analysis for missing files, and the 4-scenario response logic.

#### **Step 2.1: Implement Disk Scanning**

- [ ] **Update `src/services/FileService.ts`**:
  - **Method `scanDirectory()`**:
    - Use `vscode.workspace.findFiles` (`'**/*'`, exclude `node_modules`, `.git`, `dist`, etc.).
    - **Output:** Return a list of `StructureNode` representing the actual disk state.
    - **Crucial:** Ensure IDs are relative paths to match the plan's logic.

#### **Step 2.2: Implement DriftService (The Logic)**

- [ ] **Create `src/services/DriftService.ts`**:
  - **Method `calculateDrift(planNodes, actualNodes)`**:
    - **Input:** List of nodes from Plan and List of nodes from Disk.
    - **Process:** Compare IDs/Paths.
    - **Output:** Return a Raw Drift Object (NOT the final DiagramData yet):
      ```typescript
      {
        missing: StructureNode[],   // In Plan, NOT on Disk
        untracked: StructureNode[], // On Disk, NOT in Plan
        matched: StructureNode[]    // In Both
      }
      ```
  - **Helper Methods:**
    - `generateDiagramData(nodes, edges)`: Helper to convert node lists back into full `DiagramData` format (including Mermaid generation) for the response.

#### **Step 2.3: Update AiService (Drift Analysis)**

- [ ] **Update `src/services/AiService.ts`**:
  - **Method `analyzeDrift(missingNodes)`**:
    - **Input:** List of missing nodes.
    - **Prompt:** "You are a Tech Lead. These files are in the architecture plan but missing from the disk: [list]. Analyze why (renamed? deleted? typo?) and suggest a fix."
    - **Output:** A short string message.

#### **Step 2.4: Wiring Drift Command (The 4 Scenarios)**

- [ ] **Update `src/handlers/CommandHandler.ts`**:
  - **Case `CHECK_DRIFT`**:
    1.  Get `planNodes` (Memory/Load) & `actualNodes` (`FileService.scanDirectory`).
    2.  Get raw drift results (`DriftService.calculateDrift`).
    3.  **Determine Scenario & Send Response:**
        - **Scenario 2.1 (All Matched):**
          - If `missing.length === 0` && `untracked.length === 0`:
          - Send `AI_RESPONSE` -\> Type `ALL_MATCHED`.
        - **Scenario 2.2 (Missing Only):**
          - Call `AiService.analyzeDrift(missing)`.
          - Send `AI_RESPONSE` -\> Type `MISSING_DIAGRAM` (with AI message).
        - **Scenario 2.3 (Untracked Only):**
          - Send `AI_RESPONSE` -\> Type `UNTRACKED_DIAGRAM` (Static message: "New files detected...").
        - **Scenario 2.4 (Mixed):**
          - **Step A:** Call AI & Send `MISSING_DIAGRAM`.
          - **Step B:** Immediately Send `UNTRACKED_DIAGRAM`.

---

### **Phase 3: Sync & Final Integration (Day 3)**

**Goal:** Allow users to overwrite the diagram with reality (Sync) and verify the full loop.

#### **Step 3.1: Implement Sync Logic**

- [ ] **Update `src/handlers/CommandHandler.ts`**:
  - **Case `SYNC_TO_ACTUAL`**:
    - Call `FileService.scanDirectory()` to get the "Truth".
    - **Construct new Diagram Data:**
      - All `actualNodes` become standard nodes (no specific status or status = MATCHED).
      - Re-generate Edges/Mermaid if needed.
    - Call `FileService.saveDiagram()` to overwrite `.repoplan.json`.
    - Send `AI_RESPONSE` -\> Type `DIAGRAM` (Message: "Synced with codebase").

#### **Step 3.2: Edge Cases & Polish**

- [ ] **Empty Workspace:** Handle case where `scanDirectory` returns empty (new project).
- [ ] **Path Normalization:** Ensure `DriftService` handles Windows `\` vs POSIX `/` to avoid false "Missing/Untracked" flags.
- [ ] **Unit Tests:** Update `test/phase2Test.ts` to simulate the 4 separate scenarios and verify correct payloads are received.

#### **Step 3.3: Verification**

- [ ] **Test Flow:**
  1.  **Matched:** Generate -\> Save -\> Check Drift -\> Expect `ALL_MATCHED`.
  2.  **Untracked:** Create `new.ts` -\> Check Drift -\> Expect `UNTRACKED_DIAGRAM`.
  3.  **Missing:** Delete `app.ts` -\> Check Drift -\> Expect `MISSING_DIAGRAM` + AI explanation.
  4.  **Mixed:** Do both -\> Check Drift -\> Expect 2 messages.
  5.  **Sync:** Click Sync -\> Save -\> Check Drift again -\> Expect `ALL_MATCHED`.

<!-- end list -->

```

```
