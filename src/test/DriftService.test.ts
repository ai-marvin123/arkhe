import { describe, it, expect } from "vitest";
import { DriftService } from "../services/DriftService";
import { StructureNode } from "../types";

// Helper to quickly create a mock node
const makeNode = (id: string): StructureNode => ({
  id,
  label: id.split("/").pop() || id,
  type: "FILE",
  path: id,
  parentId: "root",
});

describe("DriftService (Comprehensive)", () => {
  // -------------------------------------------------------------
  // TEST CASE 1: STANDARD MIXED LOGIC (Happy Path)
  // -------------------------------------------------------------
  it("should correctly identify MATCHED, MISSING, and UNTRACKED nodes simultaneously", () => {
    const plan = [
      makeNode("src/kept.ts"), // Exists in both
      makeNode("src/removed.ts"), // Only in Plan
    ];

    const actual = [
      makeNode("src/kept.ts"), // Exists in both
      makeNode("src/added.ts"), // Only in Disk
    ];

    const result = DriftService.calculateDrift(plan, actual);

    // 1. MATCHED
    expect(result.matched).toHaveLength(1);
    expect(result.matched[0].id).toBe("src/kept.ts");
    expect(result.matched[0].status).toBe("MATCHED");

    // 2. MISSING
    expect(result.missing).toHaveLength(1);
    expect(result.missing[0].id).toBe("src/removed.ts");
    expect(result.missing[0].status).toBe("MISSING");

    // 3. UNTRACKED
    expect(result.untracked).toHaveLength(1);
    expect(result.untracked[0].id).toBe("src/added.ts");
    expect(result.untracked[0].status).toBe("UNTRACKED");
  });

  // -------------------------------------------------------------
  // TEST CASE 2: CROSS-PLATFORM & CASE INSENSITIVITY (Windows/macOS)
  // -------------------------------------------------------------
  // Explain: Windows/macOS treat "User.ts" and "user.ts" as the same file.
  // DriftService MUST normalize this to avoid false "Missing" alerts.
  it("should normalize casing (Case Insensitive Matching)", () => {
    const plan = [makeNode("src/UserHelper.ts")]; // CamelCase in Plan
    const actual = [makeNode("src/userhelper.ts")]; // lowercase on Disk (common in git)

    const result = DriftService.calculateDrift(plan, actual);

    expect(result.matched).toHaveLength(1);
    expect(result.missing).toHaveLength(0);
    expect(result.untracked).toHaveLength(0);

    // Ensure the ID matches but status is MATCHED
    expect(result.matched[0].status).toBe("MATCHED");
  });

  // -------------------------------------------------------------
  // TEST CASE 3: WINDOWS BACKSLASH NORMALIZATION
  // -------------------------------------------------------------
  // Explain: Windows paths use backslashes (src\utils\date.ts).
  // The service must convert them to forward slashes to match the Plan.
  it("should normalize Windows backslashes to forward slashes", () => {
    const plan = [makeNode("src/utils/date.ts")]; // Plan always uses forward slash

    // Simulate Windows File System output
    const actual = [makeNode("src\\utils\\date.ts")];

    const result = DriftService.calculateDrift(plan, actual);

    expect(result.matched).toHaveLength(1);
    expect(result.matched[0].status).toBe("MATCHED");
    // Verify that the ID in matched list is clean (optional, depends on implementation preference)
  });

  // -------------------------------------------------------------
  // TEST CASE 4: TOTAL DISCONNECT
  // -------------------------------------------------------------
  it("should handle completely different sets of files", () => {
    const plan = [makeNode("old_project/main.ts")];
    const actual = [makeNode("new_project/app.ts")];

    const result = DriftService.calculateDrift(plan, actual);

    expect(result.matched).toHaveLength(0);
    expect(result.missing).toHaveLength(1); // The old one is missing
    expect(result.untracked).toHaveLength(1); // The new one is untracked
  });

  // -------------------------------------------------------------
  // TEST CASE 5: EMPTY STATES
  // -------------------------------------------------------------
  it("should return empty arrays when inputs are empty", () => {
    const result = DriftService.calculateDrift([], []);

    expect(result.matched).toEqual([]);
    expect(result.missing).toEqual([]);
    expect(result.untracked).toEqual([]);
  });

  it("should mark all as missing if disk is empty", () => {
    const plan = [makeNode("file.ts")];
    const result = DriftService.calculateDrift(plan, []);

    expect(result.missing).toHaveLength(1);
    expect(result.matched).toHaveLength(0);
  });
});
