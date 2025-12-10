### **0. Backend Architecture Update**

We are adding two new services to handle file system operations and comparison logic.

```text
src/
├── types/
│   └── index.ts          # UPDATE: Add DriftStatus, update StructureNode
├── services/
│   ├── AiService.ts      # (Existing)
│   ├── FileService.ts    # NEW: Handles Save/Load .repoplan.json & Scanning Disk
│   └── DriftService.ts   # NEW: Logic for Comparing Plan vs. Actual (Diffing)
├── handlers/
│   └── CommandHandler.ts # UPDATE: Handle new Drift commands
└── ...
```

---

### **Phase 1: Types & Persistence (Day 1)**

**Goal:** Enable saving and loading the architectural plan to/from the disk (`.repoplan.json`).

#### **Step 1.1: Update Shared Types**

- [x] **Update `src/types/index.ts`**:
  - Add `DriftStatus` type (`'MATCHED' | 'MISSING' | 'UNTRACKED'`).
  - Update `StructureNode` interface to include optional `status`.
  - Ensure `FrontendMessage` and `BackendMessage` unions include the new commands defined in `IPC_PROTOCOL.md` (v2).

#### **Step 1.2: Implement FileService (Persistence)**

- [ ] **Create `src/services/FileService.ts`**.
- [ ] **Setup:** Import `vscode` and `fs`/`path`.
- [ ] **Method `getWorkspaceRoot()`**: Helper to get the current workspace URI.
- [ ] **Method `savePlan(sessionId, diagramData)`**:
  - Target file: `.repoplan.json` in workspace root.
  - Write `diagramData.jsonStructure` to disk.
- [ ] **Method `loadPlan(sessionId)`**:
  - Check if `.repoplan.json` exists.
  - If yes: Read content, return `DiagramData`.
  - If no: Return `null`.

#### **Step 1.3: Wiring Persistence Commands**

- [ ] **Update `src/handlers/CommandHandler.ts`**:
  - **Case `SAVE_PLAN`**: Call `FileService.savePlan`. Send success `AI_RESPONSE` (Text).
  - **Case `LOAD_PLAN`**: Call `FileService.loadPlan`.
    - If result exists: Send `AI_RESPONSE` (Type: `DIAGRAM`).
    - If null: Send `AI_RESPONSE` (Type: `TEXT`, message: "No plan found").

---

### **Phase 2: Scanning & Drift Engine (Day 2)**

**Goal:** Implement the logic to scan the actual file system and compare it against the plan.

#### **Step 2.1: Implement Disk Scanning**

- [ ] **Update `src/services/FileService.ts`**:
  - **Method `scanDirectory()`**:
    - Use `vscode.workspace.findFiles` (Best practice: respects `.gitignore`).
    - **Pattern:** `'**/*'`
    - **Exclude:** `node_modules`, `.git`, `dist`, `out`, `build`.
    - **Output:** Return a list of `StructureNode` representing the actual disk state.
    - **Important:** Use the file's **relative path** as the `id` for these nodes.

#### **Step 2.2: Implement DriftService (The Logic)**

- [ ] **Create `src/services/DriftService.ts`**.
- [ ] **Method `calculateDrift(planNodes, actualNodes)`**:
  - **Algorithm:**
    1.  Create a Map of `actualNodes` by ID (Path).
    2.  **Mark MATCHED/MISSING:** Iterate through `planNodes`. If found in Map, mark `MATCHED`. If not found, mark `MISSING`.
    3.  **Mark UNTRACKED:** Iterate through `actualNodes`. If not found in `planNodes`, mark `UNTRACKED`.
    4.  **Merge:** Return the combined list of nodes + edges.

#### **Step 2.3: Wiring Drift Command**

- [ ] **Update `src/handlers/CommandHandler.ts`**:
  - **Case `CHECK_DRIFT`**:
    - Send `PROCESSING_STATUS` (`scanning`).
    - Get current Plan (from Memory/SessionManager or `loadPlan`).
    - Get Actual Nodes (`FileService.scanDirectory`).
    - Run Diff (`DriftService.calculateDrift`).
    - Send `AI_RESPONSE` (Type: `DIAGRAM`) with the colored nodes.

---

### **Phase 3: Sync & Final Integration (Day 3)**

**Goal:** Allow users to overwrite the plan with reality and ensure the full loop works.

#### **Step 3.1: Implement Sync Logic**

- [ ] **Update `src/handlers/CommandHandler.ts`**:
  - **Case `SYNC_TO_ACTUAL`**:
    - Call `FileService.scanDirectory()` to get the "Truth".
    - **Construct new Diagram Data:** Create a clean diagram where all actual nodes are standard (remove `UNTRACKED` status, just make them normal nodes).
    - Call `FileService.savePlan()` to overwrite `.repoplan.json`.
    - Send `AI_RESPONSE` (Type: `DIAGRAM`) to update UI.

#### **Step 3.2: Edge Cases & Polish**

- [ ] **Empty Workspace:** Handle case where `scanDirectory` returns empty (new project).
- [ ] **Relative Path IDs:** Ensure `DriftService` normalizes paths (e.g., handles Windows `\` vs POSIX `/`) so IDs match correctly.
- [ ] **Refine `AI_RESPONSE`:** Ensure the Frontend receives the correct `DriftStatus` enum strings.

#### **Step 3.3: Verification**

- [ ] **Test Flow:**
  1.  Generate Plan -\> Save -\> Check `.repoplan.json` created.
  2.  Reload Window -\> Extension loads Plan automatically.
  3.  Create a dummy file manually (e.g., `test.ts`).
  4.  Click "Check Drift" -\> Verify `test.ts` appears as Gray (UNTRACKED).
  5.  Delete a file from Plan -\> Verify it appears as Red (MISSING).
  6.  Click "Sync" -\> Verify Plan updates and colors reset.
