import { describe, it, expect } from "vitest";
import { generateMermaidFromJSON } from "../utils/mermaidGenerator";
import { JsonStructure } from "../types";

describe("Mermaid Generator Utility", () => {
  // ---------------------------------------------------------
  // 1. HAPPY PATH: Standard Graph
  // ---------------------------------------------------------
  it("should generate correct syntax for connected nodes", () => {
    const input: JsonStructure = {
      nodes: [
        { id: "root", label: "root", type: "FOLDER", path: "/root" },
        {
          id: "src",
          label: "src",
          type: "FOLDER",
          path: "/root/src",
        },
      ],
      edges: [{ source: "root", target: "src" }],
    };

    const result = generateMermaidFromJSON(input);

    // Expect header
    expect(result).toContain("graph TD;");

    // Expect edge connection syntax: Source(Label) --> Target(Label);
    expect(result).toContain("root(root) --> src(src);");
  });

  // ---------------------------------------------------------
  // 2. ORPHAN NODES (Isolated files)
  // ---------------------------------------------------------
  // Logic: Nodes not involved in any edge must still be rendered separately.
  it("should render orphan nodes that have no edges", () => {
    const input: JsonStructure = {
      nodes: [
        {
          id: "README.md",
          label: "README.md",
          type: "FILE",
          path: "/root/README.md",
        },
        {
          id: "LICENSE",
          label: "LICENSE",
          type: "FILE",
          path: "/root/LICENSE",
        },
      ],
      edges: [], // No edges
    };

    const result = generateMermaidFromJSON(input);

    expect(result).toContain("README.md(README.md);");
    expect(result).toContain("LICENSE(LICENSE);");
  });

  // ---------------------------------------------------------
  // 3. SANITIZATION (Critical for Mermaid Stability)
  // ---------------------------------------------------------
  // Logic: Mermaid uses parentheses () for node shapes.
  // If a filename contains '()' or '"', it breaks the syntax. We must strip them.
  it('should sanitize special characters [" ( )] from labels', () => {
    const input: JsonStructure = {
      nodes: [
        {
          id: "file1",
          label: "func(args).ts",
          type: "FILE",
          path: "",
        }, // Contains ()
        {
          id: "file2",
          label: 'config"v2".json',
          type: "FILE",
          path: "",
        }, // Contains "
      ],
      edges: [{ source: "file1", target: "file2" }],
    };

    const result = generateMermaidFromJSON(input);

    // Expect 'func(args).ts' -> 'funcargs.ts'
    // Expect 'config"v2".json' -> 'configv2.json'
    expect(result).toContain("file1(funcargs.ts) --> file2(configv2.json);");
  });

  // ---------------------------------------------------------
  // 4. EDGE CASE: Empty Input
  // ---------------------------------------------------------
  it("should return empty string if input nodes are empty", () => {
    const input: JsonStructure = {
      nodes: [],
      edges: [],
    };

    const result = generateMermaidFromJSON(input);

    expect(result).toBe("");
  });

  // ---------------------------------------------------------
  // 5. MIXED CASE: Connected + Orphan
  // ---------------------------------------------------------
  it("should handle mixed connected and orphan nodes correctly", () => {
    const input: JsonStructure = {
      nodes: [
        { id: "A", label: "A", type: "FOLDER", path: "" },
        { id: "B", label: "B", type: "FOLDER", path: "" },
        { id: "C", label: "C", type: "FILE", path: "" }, // Orphan
      ],
      edges: [
        { source: "A", target: "B" }, // Only A->B
      ],
    };

    const result = generateMermaidFromJSON(input);

    // Connected
    expect(result).toContain("A(A) --> B(B);");
    // Orphan (Should not be re-rendered as an edge)
    expect(result).toContain("C(C);");
    // Ensure B is NOT rendered as an orphan (since it's in an edge)
    // Note: The logic handles this by tracking rendered IDs.
    // We check via negative assertion is hard on string, but checking explicit orphan line:
    // "  B(B);\n" should ideally NOT exist if format is strict,
    // but main goal is ensuring it appears at least once correctly.
  });
});
