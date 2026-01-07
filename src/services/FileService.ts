import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { StructureNode, DiagramData } from "../types";
import ignore = require("ignore");
import { generateMermaidFromJSON } from "../utils/mermaidGenerator";

const PLAN_FILENAME = ".repoplan.json";

export class FileService {
  static getWorkspaceRoot(): string | null {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      console.warn("[FileService] No workspace folder detected.");
      return null;
    }
    return folders[0].uri.fsPath;
  }
  static resolveAbsolutePath(virtualPath: string): string | null {
    const root = this.getWorkspaceRoot();
    if (!root) {
      return null;
    }

    const cleanedPath = virtualPath.replace(/^\/root\/?/, "");
    const absolutePath = path.join(root, cleanedPath);

    if (!fs.existsSync(absolutePath)) {
      return null;
    }

    return absolutePath;
  }
  private static ensureWorkspace(): string | null {
    const root = this.getWorkspaceRoot();
    if (!root) {
      vscode.window.showWarningMessage(
        "Arkhe: No workspace is open - cannot perform file operations."
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
      // 1. CLEANUP: Remove 'status' field from all nodes
      const cleanNodes = diagram.jsonStructure.nodes.map((node) => {
        const { status, ...cleanNode } = node;
        return cleanNode;
      });

      // 2. CONSTRUCT CLEAN DATA
      const cleanDiagram: DiagramData = {
        ...diagram,
        jsonStructure: {
          ...diagram.jsonStructure,
          nodes: cleanNodes as any,
        },
      };

      // console.log('cleanDiagram.jsonStructure: ', cleanDiagram.jsonStructure);

      // 3. RE-GENERATE MERMAID (Based on clean data)
      if (cleanDiagram.jsonStructure) {
        cleanDiagram.mermaidSyntax = generateMermaidFromJSON(
          cleanDiagram.jsonStructure
        );
      }

      await fs.promises.writeFile(
        filePath,
        JSON.stringify(cleanDiagram, null, 2),
        "utf8"
      );

      // console.log(`[FileService] Saved .repoplan.json → ${filePath}`);
      return true;
    } catch (err) {
      console.error("[FileService] Error writing .repoplan.json:", err);
      vscode.window.showErrorMessage(
        "Arkhe: Failed to save architecture plan."
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
      // console.log('[FileService] No saved .repoplan.json found');
      return null;
    }

    try {
      const fileContent = await fs.promises.readFile(filePath, "utf8");
      const diagram: DiagramData = JSON.parse(fileContent);

      // console.log(`[FileService] Loaded saved diagram from ${filePath}`);
      return diagram;
    } catch (err) {
      console.error("[FileService] Failed to load .repoplan.json:", err);
      vscode.window.showErrorMessage(
        "Arkhe: Failed to load architecture plan."
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
    if (!rootPath) {
      return { nodes: [], edges: [] };
    }

    const nodes: StructureNode[] = [];
    const edges: { source: string; target: string }[] = [];
    const ROOT_ID = "root";
    const ROOT_PATH_PREFIX = "/root";

    // 1. Setup Ignore Manager & Add SAFETY DEFAULTS
    const ig = ignore();

    ig.add([".git", "node_modules", ".DS_Store"]);

    // 2. Load .gitignore (Dynamic Override)
    try {
      const gitignorePath = path.join(rootPath, ".gitignore");
      const content = await fs.promises.readFile(gitignorePath, "utf8");

      ig.add(content);

      // console.log('[FileService] Loaded rules from .gitignore');
    } catch (err) {
      console.warn(
        "[FileService] No .gitignore found. Using safety defaults only."
      );
    }

    const ARCHITECTURE_WHITELIST = ["!.env", "!.env.*"];
    ig.add(ARCHITECTURE_WHITELIST);

    nodes.push({
      id: ROOT_ID,
      label: "root",
      path: ROOT_PATH_PREFIX,
      type: "FOLDER",
      level: 0,
      parentId: null,
    });

    // 3. Recursive Walker
    const walk = async (
      currentAbsPath: string,
      parentId: string,
      currentVirtualPath: string
    ) => {
      try {
        const entries = await fs.promises.readdir(currentAbsPath, {
          withFileTypes: true,
        });

        for (const entry of entries) {
          const name = entry.name;
          const absPath = path.join(currentAbsPath, name);

          const relativePathFromRoot = path.relative(rootPath, absPath);

          // Check Ignore (Library logic)
          if (ig.ignores(relativePathFromRoot)) {
            continue;
          }

          const virtualPath = `${currentVirtualPath}/${name}`;

          const node: StructureNode = {
            id: virtualPath,
            label: name,
            path: virtualPath,
            type: entry.isDirectory() ? "FOLDER" : "FILE",
            level: virtualPath.split("/").length - 1,
            parentId: parentId,
          };

          nodes.push(node);
          edges.push({ source: parentId, target: virtualPath });

          if (entry.isDirectory()) {
            await walk(absPath, virtualPath, virtualPath);
          }
        }
      } catch (error) {
        console.warn(`[FileService] Error reading ${currentAbsPath}:`, error);
      }
    };

    // console.log('[FileService] Starting recursive scan...');
    await walk(rootPath, ROOT_ID, ROOT_PATH_PREFIX);

    return { nodes, edges };
  }
}
