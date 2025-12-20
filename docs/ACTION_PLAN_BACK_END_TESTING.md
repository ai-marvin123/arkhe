# ACTION_PLAN_BACK_END_TESTING.md

## 🎯 Objective

Setup a lightweight Unit Testing environment using **Jest**.
**Strategy:** Mock `vscode`, `fs`, and `OpenAI` to test logic instantly without launching the Extension Host.

---

## 📅 Phase 1: Environment Setup

**Goal:** Install runner and configure TypeScript support.

- [x] **1. Install Dependencies:**

```bash
npm install --save-dev jest ts-jest @types/jest

```

- [ ] **2. Create `jest.config.js` (Root):**

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/out/', '<rootDir>/dist/'],
  moduleNameMapper: {
    '^vscode$': '<rootDir>/src/test/__mocks__/vscode.ts',
  },
};
```

---

## 📅 Phase 2: The "Magic" Mock (Crucial)

**Goal:** Fake the VS Code API so tests don't crash in Node.js.

- [x] **1. Create Mock Directory:** `src/test/__mocks__`
- [x] **2. Create `vscode.ts`:**

```typescript
// src/test/__mocks__/vscode.ts
export const window = {
  showErrorMessage: jest.fn(),
  showInformationMessage: jest.fn(),
  createWebviewPanel: jest.fn(),
  showTextDocument: jest.fn(),
};

export const workspace = {
  workspaceFolders: [{ uri: { fsPath: '/mock/root' } }],
  getConfiguration: jest.fn(),
};

export const commands = {
  executeCommand: jest.fn(),
};

export const Uri = {
  file: (path: string) => ({ fsPath: path, scheme: 'file' }),
  parse: (path: string) => ({ fsPath: path, scheme: 'file' }),
};

export const ViewColumn = { Beside: 1 };
```

---

## 📅 Phase 3: Writing Tests (Priority Order)

### 🟢 Priority 1: Pure Logic (Drift & Mermaid)

_These have no dependencies and are easiest to test._

- [ ] **Test `DriftService.test.ts`:**
- [ ] Create 2 mock lists: `planNodes` (Plan) vs `actualNodes` (Disk).
- [ ] **Case A:** `missing` (In Plan, not on Disk).
- [ ] **Case B:** `untracked` (On Disk, not in Plan).
- [ ] **Case C:** `matched` (ID matches).

- [ ] **Test `mermaidGenerator.test.ts`:**
- [ ] Input: A JSON Structure object.
- [ ] Output: Assert the returned string contains `graph TD;`.

### 🟡 Priority 2: Command Handler (The Brain)

_Test if the backend routes commands correctly._

- [ ] **Test `CommandHandler.test.ts`:**
- [ ] **Setup:** Mock `webviewPanel.postMessage`.
- [ ] **Mock Service:** Mock `AiService.generateStructure` to return fake JSON.
- [ ] **Test `GENERATE_STRUCTURE`:**
- Call `handle({ command: 'GENERATE_STRUCTURE', ... })`.
- Expect `postMessage` to be called with `AI_RESPONSE`.

- [ ] **Test `SAVE_SETTINGS`:**
- Call `handle({ command: 'SAVE_SETTINGS', payload: { apiKey: 'sk-test' ... } })`.
- Expect `ConfigManager.setApiKey` to be called.
- Expect `AiService.verifyApiKey` to be called.

---

## 📅 Phase 4: Execution

- [ ] **Run Tests:**

```bash
npx jest

```

- [ ] **Watch Mode (Dev):**

```bash
npx jest --watch

```
