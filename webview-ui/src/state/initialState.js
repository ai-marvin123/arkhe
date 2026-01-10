// const DUMMY_LOG_DATA = [
//   // 1. User's Initial Prompt (Log entry 1)
//   {
//     id: "L-001",
//     role: "user" as const,
//     type: "TEXT_INPUT" as const,
//     text: "Create a simple landing page with a database service.",
//     timestamp: 1733446800000,
//     diagramData: null,
//     viewSettings: null,
//     contentRefId: null,
//   },
//   // 2. Diagram Content (Log entry 2 - The first diagram version)
//   {
//     id: "D-001", // This is the unique ID for the content (V1)
//     role: "assistant" as const,
//     type: "DIAGRAM_CONTENT" as const,
//     text: "V1 Blueprint generated: Added three core nodes.",
//     timestamp: 1733446800001,
//     contentRefId: null,
//     diagramData: {
//       // NOTE: This must be the final, fully styled syntax for the renderer!
//       mermaidSyntax: `graph TD;
//       A-->B;`,
//       jsonStructure: {
//         nodes: [
//           { id: "A", label: "A", type: "FILE", path: "A.ts" },
//           {
//             id: "B",
//             label: "B",
//             type: "FOLDER",
//
//             path: "components/",
//           },
//         ],
//         edges: [{ source: "A", target: "B" }],
//       },
//     },
//     viewSettings: {
//       zoomLevel: 1.0, // Default view for this initial entry
//       panX: 0,
//       panY: 0,
//       isFullscreen: false,
//       isLoading: false, // This should always be false in a static log entry
//       lastLLMMessage: "V1 Blueprint generated: Added three core nodes.",
//     },
//   },
//   // 3. User's Follow-up Prompt (Log entry 3)
//   {
//     id: "L-002",
//     role: "user" as const,
//     type: "TEXT_INPUT" as const,
//     text: "Change the color palette to red and black (Testing unfulfilled request).",
//     timestamp: 1733446860000,
//     diagramData: null,
//     viewSettings: null,
//     contentRefId: null,
//   },
//   // 4. Text-Only Response (Log entry 4 - Clarification/Error)
//   {
//     id: "L-003",
//     role: "assistant" as const,
//     type: "TEXT_RESPONSE" as const,
//     text: "I cannot fulfill that request; I am limited to structure, not visual design.",
//     timestamp: 1733446860001,
//     diagramData: null,
//     viewSettings: null,
//     contentRefId: null,
//   },
// ];
//define initalState structure
export const initialState = {
  //A. Session id to send to BE
  session: {
    sessionId: '',
  },
  // B. Current diagram
  diagram: {
    jsonStructure: { nodes: [], edges: [] },
    mermaidSyntax: '',
  },
  // C. Current view
  view: {
    zoomLevel: 1.0,
    panX: 0,
    panY: 0,
    isFullscreen: false,
    isLoading: false,
    lastLLMMessage: '',
  },
  // D. AI Chat log
  chat: {
    log: [],
    currentInput: '',
  },
};
//# sourceMappingURL=initialState.js.map
