import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { DiagramData } from '../types';

const PLAN_FILENAME = '.repoplan.json';

export class FileService {
  static getWorkspaceRoot(): string | null {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      console.warn('[FileService] No workspace folder detected.');
      return null;
    }
    return folders[0].uri.fsPath;
  }

  private static ensureWorkspace(): string | null {
    const root = this.getWorkspaceRoot();
    if (!root) {
      vscode.window.showWarningMessage(
        'Arkhe: No workspace is open - cannot perform file operations.'
      );
      return null;
    }
    return root;
  }

  static async saveDiagram(
    sessionId: string,
    diagram: DiagramData
  ): Promise<boolean> {
    const root = this.ensureWorkspace();
    if (!root) {
      return false;
    }

    const filePath = path.join(root, PLAN_FILENAME);

    try {
      await fs.promises.writeFile(
        filePath,
        JSON.stringify(diagram, null, 2),
        'utf8'
      );

      console.log(`[FileService] Saved .repoplan.json → ${filePath}`);
      return true;
    } catch (err) {
      console.error('[FileService] Error writing .repoplan.json:', err);
      vscode.window.showErrorMessage(
        'Arkhe: Failed to save architecture plan.'
      );
      return false;
    }
  }

  static async loadDiagram(sessionId: string): Promise<DiagramData | null> {
    const root = this.getWorkspaceRoot();
    if (!root) {
      return null;
    }

    const filePath = path.join(root, PLAN_FILENAME);

    // If file does NOT exist → return null
    if (!fs.existsSync(filePath)) {
      console.log('[FileService] No saved .repoplan.json found');
      return null;
    }

    try {
      const fileContent = await fs.promises.readFile(filePath, 'utf8');
      const diagram: DiagramData = JSON.parse(fileContent);

      console.log(`[FileService] Loaded saved diagram from ${filePath}`);
      return diagram;
    } catch (err) {
      console.error('[FileService] Failed to load .repoplan.json:', err);
      vscode.window.showErrorMessage(
        'Arkhe: Failed to load architecture plan.'
      );
      return null;
    }
  }
    static async scanDirectory(sessionId: string) {
  const root = this.getWorkspaceRoot();
  if (!root) {
    return [];
  }

  // Scan workspace respecting .gitignore
  const fileUris = await vscode.workspace.findFiles(
    "**/*",
    "{**/node_modules/**,**/.git/**,**/dist/**,**/out/**,**/build/**}"
  );

  const nodes: any[] = [];

  // 1. Build file nodes
  for (const uri of fileUris) {
    const absPath = uri.fsPath;

    // Compute normalized relative path
    let relPath = path.relative(root, absPath);
    relPath = relPath.replace(/\\/g, "/"); // Windows → POSIX

    nodes.push({
      id: relPath,
      label: path.basename(relPath),
      path: relPath,
      isFolder: false,
      level: relPath.split("/").length - 1,
    });
  }

  // 2. Derive folder nodes
  const folderSet = new Set<string>();

  nodes.forEach((node) => {
    const parts = node.path.split("/");
    let current = "";

    for (let i = 0; i < parts.length - 1; i++) {
      current = i === 0 ? parts[i] : `${current}/${parts[i]}`;
      folderSet.add(current);
    }
  });

  for (const folder of folderSet) {
    nodes.push({
      id: folder,
      label: path.basename(folder),
      path: folder,
      isFolder: true,
      level: folder.split("/").length - 1,
    });
  }

  console.log(
    `[FileService] Scanned workspace → ${nodes.length} nodes found.`
  );
  return nodes;
}