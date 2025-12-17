import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { StructureNode, DiagramData } from '../types';

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
  /**
   * Scans the workspace and builds a complete graph structure (Nodes + Edges).
   * Returns a full DiagramData object instead of just an array of nodes.
   */
  static async scanDirectory(sessionId: string): Promise<{
    nodes: StructureNode[];
    edges: { source: string; target: string }[];
  }> {
    const rootPath = this.getWorkspaceRoot();

    // Default return if no workspace is open
    if (!rootPath) {
      return { nodes: [], edges: [] };
    }

    // 1. Scan files (respecting .gitignore)
    const fileUris = await vscode.workspace.findFiles(
      '**/*',
      '{**/node_modules/**,**/.git/**,**/dist/**,**/out/**,**/build/**}'
    );

    const nodes: StructureNode[] = [];

    // --- PHASE 1: BUILD NODES ---

    // A. Initialize the Root Node explicitly
    nodes.push({
      id: 'root',
      label: 'root',
      path: '/root',
      type: 'FOLDER',
      level: 0,
      parentId: null,
    });

    // B. Process Files
    for (const uri of fileUris) {
      const absPath = uri.fsPath;
      // Normalize path to forward slashes
      const relPath = path.relative(rootPath, absPath).replace(/\\/g, '/');
      const fullVirtualPath = `/root/${relPath}`;

      // Determine Parent ID
      let parentId = 'root';
      if (relPath.includes('/')) {
        const parentPath = relPath.substring(0, relPath.lastIndexOf('/'));
        parentId = `/root/${parentPath}`;
      }

      nodes.push({
        id: fullVirtualPath,
        label: path.basename(relPath),
        path: fullVirtualPath,
        type: 'FILE',
        level: fullVirtualPath.split('/').length - 1,
        parentId: parentId,
      });
    }

    // C. Derive Folder Nodes
    const folderSet = new Set<string>();

    nodes.forEach((node) => {
      if (node.id === 'root') {
        return;
      }
      const parts = node.path.split('/');
      let currentPath = parts[0]; // "/root"

      for (let i = 1; i < parts.length - 1; i++) {
        currentPath = `${currentPath}/${parts[i]}`;
        folderSet.add(currentPath);
      }
    });

    for (const folderPath of folderSet) {
      // Determine parent for the folder
      if (folderPath === '/root' || folderPath === 'root') {
        continue;
      }
      const parentDir = folderPath.substring(0, folderPath.lastIndexOf('/'));
      const parentId = parentDir === '/root' ? 'root' : parentDir;

      nodes.push({
        id: folderPath,
        label: path.basename(folderPath),
        path: folderPath,
        type: 'FOLDER',
        level: folderPath.split('/').length - 1,
        parentId: parentId,
      });
    }

    // --- PHASE 2: GENERATE EDGES ---
    // Now that we have all nodes with valid 'parentId',
    // we can strictly generate edges for the "Actual" graph.
    const edges: { source: string; target: string }[] = [];

    nodes.forEach((node) => {
      // If a node has a parent, there MUST be a connection edge.
      if (node.parentId) {
        edges.push({
          source: node.parentId,
          target: node.id,
        });
      }
    });

    console.log(
      `[FileService] Scanned workspace → ${nodes.length} nodes, ${edges.length} edges.`
    );

    return { nodes, edges };
  }
}
