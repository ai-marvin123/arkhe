import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { DiagramData } from "../types";

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

    const filePath = path.join(root, ".repoplan.json");

    try {
        await fs.promises.writeFile(
            filePath,
            JSON.stringify(diagram.jsonStructure, null, 2),
            "utf8"
        );

        console.log(`[FileService] Saved .repoplan.json → ${filePath}`);
    return true;
    } catch (err) {
        console.error("[FileService] Error writing .repoplan.json:", err);
        vscode.window.showErrorMessage(
            "Arkhe: Failed to save architecture plan."
        );
        return false;
    }
}

static async loadDiagram(
  sessionId: string
): Promise<DiagramData | null> {
  const root = this.getWorkspaceRoot();
  if (!root) {
    return null;
  }

  const filePath = path.join(root, PLAN_FILENAME);

  // If file does NOT exist → return null
  if (!fs.existsSync(filePath)) {
    console.log("[FileService] No saved .repoplan.json found");
    return null;
  }

  try {
    const fileContent = await fs.promises.readFile(filePath, "utf8");
    const storedJson = JSON.parse(fileContent);

    // Reconstruct DiagramData so UI can render it
    const diagram: DiagramData = {
      mermaidSyntax: "", // AI/Frontend rebuild syntax later
      jsonStructure: storedJson,
    };

    console.log(`[FileService] Loaded saved diagram from ${filePath}`);
    return diagram;
  } catch (err) {
    console.error("[FileService] Failed to load .repoplan.json:", err);
    vscode.window.showErrorMessage(
      "Arkhe: Failed to load architecture plan."
    );
    return null;
  }
}
}