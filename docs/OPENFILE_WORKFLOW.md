# Open File/Folder Workflow

**Goal:** Enable users to navigate from diagram nodes to source code without losing the visual context.
**Security:** The Webview remains sandboxed. All path resolution and file system access are handled securely by the Extension Backend.

## 1. User Flow

1. **Interaction:** User clicks a node (File or Folder) in the architecture diagram.
2. **Send:** Webview sends an `OPEN_FILE` or `OPEN_FOLDER` command with the path.
3. **Resolve:** Backend resolves the relative path against the current **Workspace Root**.
4. **Action:**

- **File:** Opens side-by-side in the Editor (`ViewColumn.Beside`).
- **Folder:** Reveals and selects the folder in the VS Code Explorer sidebar.

## 2. Message Protocol (Frontend → Backend)

**Commands:**

| Command           | Payload Structure  | Action                                 |
| ----------------- | ------------------ | -------------------------------------- |
| **`OPEN_FILE`**   | `{ path: string }` | Opens the specific file in the editor. |
| **`OPEN_FOLDER`** | `{ path: string }` | Highlights the folder in the Explorer. |

**Example Payload:**

```json
{
  "command": "OPEN_FILE",
  "payload": {
    "path": "src/index.ts"
  }
}
```

## 3. Backend Handling Strategy

**Path Resolution:**

- **Root:** `vscode.workspace.workspaceFolders[0].uri.fsPath`
- **Sanitization:** Remove virtual prefixes (e.g., `/root`) if strictly necessary.
- **Absolute Path:** `path.join(Root, payload.path)`

**API Implementation:**

- **For Files:**

```typescript
vscode.window.showTextDocument(uri, {
  viewColumn: vscode.ViewColumn.Beside,
  preview: false,
});
```

- **For Folders:**

```typescript
vscode.commands.executeCommand('revealInExplorer', uri);
```

## 4. Design Rationale

- **Context:** Opens files "Beside" the diagram so the user doesn't lose their place.
- **Separation of Concerns:** Frontend handles interaction; Backend handles File System (FS) operations.
- **Simplicity:** Uses standard VS Code APIs for native navigation experience.
