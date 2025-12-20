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
