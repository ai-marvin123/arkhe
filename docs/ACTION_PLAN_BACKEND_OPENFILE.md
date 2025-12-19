# ACTION_PLAN_BACKEND_OPEN_FILE.md

## 🎯 Objective

Enable users to click on diagram nodes to open files (side-by-side) or reveal folders in the VS Code Explorer.

---

## 📅 Phase 1: Path Resolution Utility (`FileService`)

**Goal:** Create a helper to convert diagram "virtual paths" (e.g., `/root/src/index.ts`) into OS "absolute paths".

- [ ] **Open File:** `src/services/FileService.ts`
- [ ] **Add Method:** `static resolveAbsolutePath(virtualPath: string): string | null`
- [ ] **Get Root:** Call `this.getWorkspaceRoot()`. Return `null` if no workspace.
- [ ] **Sanitize:** Remove the leading `/root` prefix from the `virtualPath`.
- _Example:_ `/root/src/index.ts` → `src/index.ts`.

- [ ] **Resolve:** Use `path.join(root, cleanedPath)` to get the OS absolute path.
- [ ] **Validate:** (Optional) Check `fs.existsSync()` to ensure the target exists before returning.

---

## 📅 Phase 2: Command Handling (`CommandHandler`)

**Goal:** Intercept `OPEN_FILE` and `OPEN_FOLDER` commands and trigger VS Code APIs.

- [ ] **Open File:** `src/handlers/CommandHandler.ts`
- [ ] **Import Dependencies:** Ensure `vscode` is imported.
- [ ] **Implement `OPEN_FILE` Case:**
- [ ] Extract `{ path }` from payload.
- [ ] Call `FileService.resolveAbsolutePath(path)`.
- [ ] Create URI: `vscode.Uri.file(absolutePath)`.
- [ ] **Execute:**

```typescript
await vscode.window.showTextDocument(uri, {
  viewColumn: vscode.ViewColumn.Beside,
  preview: false, // Keep file open (don't use italic preview mode)
});
```

- [ ] **Error Handling:** Wrap in `try/catch` and send an error message to Frontend if file fails to open.

- [ ] **Implement `OPEN_FOLDER` Case:**
- [ ] Extract `{ path }` from payload.
- [ ] Call `FileService.resolveAbsolutePath(path)`.
- [ ] Create URI: `vscode.Uri.file(absolutePath)`.
- [ ] **Execute:**

```typescript
await vscode.commands.executeCommand('revealInExplorer', uri);
```

- [ ] **Error Handling:** Wrap in `try/catch`.

---

## 📅 Phase 3: Integration & Testing

**Goal:** Verify the navigation works smoothly.

- [ ] **Test File Open:**
- [ ] Click a file node (e.g., `package.json`).
- [ ] Verify it opens in a **Split Editor** (Right side).

- [ ] **Test Folder Reveal:**
- [ ] Click a folder node (e.g., `src`).
- [ ] Verify the **Explorer Sidebar** focuses and highlights the folder.

- [ ] **Test Error Case:**
- [ ] Manually modify the payload to a non-existent path.
- [ ] Verify the extension does not crash (Graceful error log).
