import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

export interface PerformanceStep {
  startTime: number;
  duration: number;
  [key: string]: unknown; // Allow additional metadata like messageCount, nodeCount, etc.
}

export interface PerformanceLogEntry {
  timestamp: string;
  requestId: string;
  command: string;
  sessionId: string;
  model?: string;
  prompt?: string;
  steps: Record<string, PerformanceStep>;
  summary: {
    totalTime: number;
    backendTime: number;
    frontendTime: number;
    apiCallTime: number;
    apiCallPercent: string;
  };
  status: "success" | "error";
  error?: string;
}

/**
 * Collects timing data for a single request lifecycle.
 * Call startStep/endStep for each phase, then finalize() to write to log file.
 */
export class PerformanceTracker {
  private requestId: string;
  private command: string;
  private sessionId: string;
  private model?: string;
  private prompt?: string;
  private steps: Record<string, PerformanceStep> = {};
  private stepStartTimes: Record<string, number> = {};
  private requestStartTime: number;
  private status: "success" | "error" = "success";
  private error?: string;

  constructor(
    requestId: string,
    command: string,
    sessionId: string,
    requestStartTime: number
  ) {
    this.requestId = requestId;
    this.command = command;
    this.sessionId = sessionId;
    this.requestStartTime = requestStartTime;
  }

  setModel(model: string): void {
    this.model = model;
  }

  setPrompt(prompt: string): void {
    // Truncate to 50 chars
    this.prompt = prompt.length > 50 ? prompt.substring(0, 50) + "..." : prompt;
  }

  startStep(stepName: string): void {
    this.stepStartTimes[stepName] = performance.now();
  }

  endStep(stepName: string, metadata?: Record<string, unknown>): void {
    const startTime = this.stepStartTimes[stepName];
    if (startTime === undefined) {
      return;
    }

    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    this.steps[stepName] = {
      startTime: Math.round(startTime - this.requestStartTime),
      duration,
      ...metadata,
    };
  }

  setError(errorMessage: string): void {
    this.status = "error";
    this.error = errorMessage;
  }

  /**
   * Calculates summary and writes the log entry to .arkhe-perf.log
   */
  finalize(): void {
    const totalTime = Math.round(performance.now() - this.requestStartTime);

    // Calculate backend time (steps 2-11)
    let backendTime = 0;
    for (const [stepName, step] of Object.entries(this.steps)) {
      if (
        stepName.startsWith("2_") ||
        stepName.startsWith("3_") ||
        stepName.startsWith("4_") ||
        stepName.startsWith("5_") ||
        stepName.startsWith("6_") ||
        stepName.startsWith("7_") ||
        stepName.startsWith("8_") ||
        stepName.startsWith("9_") ||
        stepName.startsWith("10_") ||
        stepName.startsWith("11_")
      ) {
        backendTime += step.duration;
      }
    }

    // Get API call time specifically
    const apiCallTime = this.steps["7_api_call"]?.duration || 0;
    const apiCallPercent =
      totalTime > 0 ? ((apiCallTime / totalTime) * 100).toFixed(1) + "%" : "0%";

    // Frontend time = total - backend
    const frontendTime = totalTime - backendTime;

    const entry: PerformanceLogEntry = {
      timestamp: new Date().toISOString(),
      requestId: this.requestId,
      command: this.command,
      sessionId: this.sessionId,
      model: this.model,
      prompt: this.prompt,
      steps: this.steps,
      summary: {
        totalTime,
        backendTime,
        frontendTime,
        apiCallTime,
        apiCallPercent,
      },
      status: this.status,
      error: this.error,
    };

    PerformanceLogger.getInstance().log(entry);
  }
}

/**
 * Singleton logger that writes performance entries to .arkhe-perf.log in workspace root.
 */
export class PerformanceLogger {
  private static instance: PerformanceLogger;

  private constructor() {}

  public static getInstance(): PerformanceLogger {
    if (!PerformanceLogger.instance) {
      PerformanceLogger.instance = new PerformanceLogger();
    }
    return PerformanceLogger.instance;
  }

  private getLogPath(): string | null {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      return null;
    }
    return path.join(folders[0].uri.fsPath, ".arkhe-perf.log.json");
  }

  /**
   * Check if tracking is enabled (disabled in production)
   */
  private isEnabled(): boolean {
    return process.env.NODE_ENV !== "production";
  }

  log(entry: PerformanceLogEntry): void {
    if (!this.isEnabled()) {
      return;
    }
    this.appendToLogArray(entry);
  }

  /**
   * Log any raw object (for startup tracking)
   */
  logRaw(entry: object): void {
    if (!this.isEnabled()) {
      return;
    }
    this.appendToLogArray(entry);
  }

  /**
   * Append entry to JSON array in log file.
   * Creates file with [] if not exists.
   */
  private appendToLogArray(entry: object): void {
    const logPath = this.getLogPath();
    if (!logPath) {
      return;
    }

    try {
      // Read existing array or create empty
      let logs: object[] = [];
      if (fs.existsSync(logPath)) {
        const content = fs.readFileSync(logPath, "utf8");
        try {
          logs = JSON.parse(content);
          if (!Array.isArray(logs)) {
            logs = [];
          }
        } catch {
          // Invalid JSON, reset to empty array
          logs = [];
        }
      }

      // Append new entry
      logs.push(entry);

      // Write back with pretty formatting
      fs.writeFileSync(logPath, JSON.stringify(logs, null, 2), "utf8");
    } catch (err) {
      console.error("[PerformanceLogger] Failed to write log:", err);
    }
  }

  /**
   * Generate a unique request ID
   */
  static generateRequestId(): string {
    return "req_" + Math.random().toString(36).substring(2, 10);
  }
}

/**
 * Tracks extension startup performance.
 * Call markStep() for each phase, then finalize() to write to log.
 */
export class StartupTracker {
  private startTime: number;
  private lastStepTime: number;
  private steps: Record<string, { startTime: number; duration: number }> = {};

  constructor() {
    this.startTime = performance.now();
    this.lastStepTime = this.startTime;
  }

  /**
   * Mark completion of a step. Duration = time since last step.
   */
  markStep(stepName: string): void {
    const now = performance.now();
    this.steps[stepName] = {
      startTime: Math.round(this.lastStepTime - this.startTime),
      duration: Math.round(now - this.lastStepTime),
    };
    this.lastStepTime = now;
  }

  /**
   * Write startup log entry
   */
  finalize(): void {
    const totalTime = Math.round(performance.now() - this.startTime);

    const entry = {
      type: "STARTUP",
      timestamp: new Date().toISOString(),
      steps: this.steps,
      summary: {
        totalTime,
      },
    };

    PerformanceLogger.getInstance().logRaw(entry);
  }
}
