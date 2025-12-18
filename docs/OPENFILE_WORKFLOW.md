## Open File From Diagram Workflow

**Goal:** Allow users to open source files directly from diagram nodes without losing diagram context.
**Security:** The Webview never accesses the file system. All path resolution and file access are handled by the Extension Backend.

## 1. User Flow
**Part 1: Diagram Interaction**

**Context:** User is viewing an architecture diagram in the Webview.
**Action:** User clicks a diagram node representing a file.
**UI Event:** Webview captures the click.
**Send:** Webview sends an `OPEN_FILE` command with the file’s relative path.
**Resolve:** Backend resolves the path against the workspace root.
**Open:** File opens side-by-side in the VS Code editor.

**2. Message Protocol (Frontend ↔ Backend)**

A. Frontend → Backend (Commands)

| Command          |     Payload               | Action                          |
| :----------------| :------------------------ | :------------------------------ |
| `OPEN_FILE`      | `{ relativePath: string }`| Request to open a file by path. |
| :----------------| :------------------------ | :------------------------------ |


Example

`{`
  `"command": "OPEN_FILE",`
  `"payload": { "relativePath": "src/index.ts" }`
`}`


## B. Backend → Frontend (Events)
- No response event required.
- Errors are shown directly via VS Code notifications.

**3. Backend File Handling Strategy**
Workspace Resolution
**Root:** vscode.workspace.workspaceFolders[0]
**Path:** workspaceRoot + relativePath

Editor API
- `vscode.workspace.openTextDocument`
- `vscode.window.showTextDocument`

`viewColumn: ViewColumn.Beside`
`preview: false`

**4. Design Rationale**

- Preserves diagram visibility
- Enables single-click navigation from architecture → code
- Maintains strict FE/BE responsibility boundaries