# ACTION_PLAN_BACKEND_GENERATE_REPO.md

## 🎯 Objective
Expose a backend command to visualize the current repository by scanning the workspace and returning a DIAGRAM payload when no saved plan exists.

---

## Phase 1: IPC & Types
- [x] Add `{ command: 'GENERATE_REPO'; payload: { sessionId: string } }` to `MessageToBackend` in `src/types/index.ts`.

---

## Phase 2: Command Handling (`CommandHandler`)
- [x] Add a `case 'GENERATE_REPO'` in `src/handlers/CommandHandler.ts`:
  - Extract `{ sessionId }` from payload.
  - Invoke `FileService.scanDirectory(sessionId)` to get `{ nodes, edges }`.
  - If `nodes.length === 0`: post AI_RESPONSE `{ type: 'TEXT', message: 'Workspace is empty. Cannot generate diagram.' }` and return.
  - Else: clear any `status` fields (`const cleanNodes = nodes.map(n => ({ ...n, status: undefined }))`).
  - Build diagram via `DriftService.generateDiagramData(cleanNodes, edges)`.
  - Post AI_RESPONSE `{ type: 'DIAGRAM', message: 'Repository structure visualized from disk.', data: diagramData }`.
  - (Optional) `aiService.saveContext(sessionId, 'Visualized repository structure from disk.', responsePayload as any)`.

---

## 📅 Phase 3: Tests (Backend)
- [x] Add jest test in `src/test/CommandHandler.test.ts`:
  - Happy path: mock `scanDirectory` to return nodes/edges → expect AI_RESPONSE with `type: 'DIAGRAM'`, and `DriftService.generateDiagramData` called.
  - Empty workspace: mock `scanDirectory` to return empty nodes → expect AI_RESPONSE with `type: 'TEXT'` mentioning “Workspace is empty”.

---

## 📅 Phase 4: QA Checklist (Backend)
- [x] Run unit tests.
- [x] Manually trigger `GENERATE_REPO` in the extension host; confirm mermaid renders and nodes/edges use `/root/...` IDs.