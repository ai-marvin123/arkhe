export const workspace = {
  workspaceFolders: [{ uri: { fsPath: process.cwd() } }]
};

export const window = {
  showWarningMessage: (...args: any[]) =>
    console.log("⚠️ mock warn:", ...args),

  showErrorMessage: (...args: any[]) =>
    console.log("❗ mock error:", ...args),
};