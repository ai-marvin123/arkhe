# Arkhe - Developer Guide

## 1\. Project Structure

This project is a **Monorepo** containing two distinct parts:

- **Backend (Extension Host):**
  - **Folder:** Root (`./`)
  - **Tech Stack:** Node.js, VS Code API, LangChain, Zod.
  - **Entry Point:** `src/extension.ts`
- **Frontend (Webview UI):**
  - **Folder:** `webview-ui/`
  - **Tech Stack:** React, Vite, TypeScript, TailwindCSS, Redux.
  - **Entry Point:** `webview-ui/src/main.tsx`

---

## 2\. Installation (First Time Setup)

You must install dependencies for **both** folders.

```bash
# 1. Install Backend dependencies (Root)
npm install

# 2. Install Frontend dependencies (Webview)
cd webview-ui
npm install
```

---

## 3\. Development Workflow (How to Run)

You need **two** processes running simultaneously.

### Step 1: Start Frontend Watcher

Open a terminal in the root folder and run:

```bash
npm run watch:webview
```

- **Purpose:** This compiles React code into the `build/` folder.
- **Note:** Wait for `built in Xms` message before proceeding.

### Step 2: Run Extension

Press **`F5`** in VS Code.

- **Purpose:** Opens a new **Extension Development Host** window.
- **Action:** In the new window, open Command Palette and run: `Arkhe`.

---

## 4\. Key Commands & Shortcuts

| Action                                 | Windows / Linux          | macOS                    |
| :------------------------------------- | :----------------------- | :----------------------- |
| **Command Palette**                    | `Ctrl` + `Shift` + `P`   | `Cmd` + `Shift` + `P`    |
| **Reload Window** (After code changes) | `Ctrl` + `R`             | `Cmd` + `R`              |
| **Open Debug Console** (Backend Logs)  | `Ctrl` + `Shift` + `Y`   | `Cmd` + `Shift` + `Y`    |
| **Toggle Dev Tools** (Frontend Logs)   | Help \> Toggle Dev Tools | Help \> Toggle Dev Tools |

---

## 5\. Architecture & Communication

The Frontend and Backend are isolated. They communicate via **Message Passing**.

### Frontend to Backend (Request)

**File:** `webview-ui/src/App.tsx`

```typescript
vscode.postMessage({
  command: 'askAI', // Command ID
  text: 'Hello Server', // Payload
});
```

### Backend to Frontend (Response)

**File:** `src/extension.ts`

```typescript
// Listen
panel.webview.onDidReceiveMessage((msg) => {
  if (msg.command === 'askAI') {
    // Reply
    panel.webview.postMessage({ command: 'aiResponse', text: 'Hello Client' });
  }
});
```

---

## 6\. Important Notes

1.  **White Screen Issue:** If the Webview is white, ensure you are running inside VS Code (F5), not a browser. The `acquireVsCodeApi()` function does not exist in Chrome/Edge.
2.  **Images/Assets:** Always put images in `webview-ui/src/assets/` and import them (e.g., `import logo from './assets/logo.svg'`). Do not use absolute paths like `/image.png`.
3.  **Tailwind CSS:** Tailwind is configured in `webview-ui`. If styles are missing, ensure `npm run watch:webview` is running.
4.  **API Keys:**
    - Create a `.env` file in the **Root** directory for OpenAI/Gemini keys.
    - **NEVER** commit `.env` to Git.
