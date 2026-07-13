// Mock for vscode module in tests
// Provides minimal stubs for VS Code API

import { vi } from "vitest";

export const workspace = {
  workspaceFolders: [{ uri: { fsPath: "/mock/workspace" } }],
  getConfiguration: vi.fn(() => ({
    get: vi.fn(),
    update: vi.fn(),
  })),
};

export const window = {
  createWebviewPanel: vi.fn(() => ({
    webview: {
      html: "",
      postMessage: vi.fn().mockResolvedValue(undefined),
      onDidReceiveMessage: vi.fn(() => ({ dispose: vi.fn() })),
      asWebviewUri: vi.fn((uri) => uri),
    },
    onDidDispose: vi.fn(() => ({ dispose: vi.fn() })),
    dispose: vi.fn(),
  })),
  showInformationMessage: vi.fn(),
  showErrorMessage: vi.fn(),
  showWarningMessage: vi.fn(),
};

export const commands = {
  registerCommand: vi.fn(() => ({ dispose: vi.fn() })),
  executeCommand: vi.fn(),
};

export const Uri = {
  file: (path: string) => ({ fsPath: path, scheme: "file" }),
  parse: (path: string) => ({ fsPath: path, scheme: "file" }),
  joinPath: (...args: { fsPath: string }[]) => ({
    fsPath: args.map((a) => a.fsPath || a).join("/"),
  }),
};

export const ViewColumn = {
  One: 1,
  Two: 2,
  Beside: 1,
};

export default {
  workspace,
  window,
  commands,
  Uri,
  ViewColumn,
};
