# Performance Analysis: Slow Diagram Generation (15-20s Response Time)

## Problem Statement

User experiences 15-20 second delay when interacting with the extension to generate diagrams. This document outlines the tracking approach and optimization plan.

---

## Phase 1: Performance Tracking Implementation

### Log File

- **Location**: `.arkhe-perf.log` in workspace root
- **Format**: JSON (one entry per line, newline-delimited)

### Log Entry Structure

```json
{
  "timestamp": "2026-01-11T09:10:23.456Z",
  "requestId": "req_a1b2c3",
  "command": "GENERATE_STRUCTURE",
  "sessionId": "sess_xyz",
  "model": "gpt-4o",
  "prompt": "Create a Next.js app with Prisma and tRPC...",

  "steps": {
    "1_frontend_submit": { "startTime": 0, "duration": 2 },
    "2_ipc_to_backend": { "startTime": 2, "duration": 5 },
    "3_session_history_load": {
      "startTime": 7,
      "duration": 15,
      "messageCount": 4
    },
    "4_prompt_template_build": { "startTime": 22, "duration": 3 },
    "5_model_init": { "startTime": 25, "duration": 150, "wasCached": false },
    "6_chain_build": { "startTime": 175, "duration": 5 },
    "7_api_call": { "startTime": 180, "duration": 12340 },
    "8_mermaid_generation": {
      "startTime": 12520,
      "duration": 12,
      "nodeCount": 15,
      "edgeCount": 14
    },
    "9_zod_validation": { "startTime": 12532, "duration": 3 },
    "10_history_save": { "startTime": 12535, "duration": 8 },
    "11_ipc_to_frontend": { "startTime": 12543, "duration": 5 },
    "12_state_update": { "startTime": 12548, "duration": 10 },
    "13_mermaid_render": { "startTime": 12558, "duration": 230 }
  },

  "summary": {
    "totalTime": 12788,
    "backendTime": 12541,
    "frontendTime": 247,
    "apiCallTime": 12340,
    "apiCallPercent": "96.5%"
  },

  "status": "success"
}
```

### Step Descriptions

| Step                    | Location                             | What It Measures                         |
| ----------------------- | ------------------------------------ | ---------------------------------------- |
| 1_frontend_submit       | `Aichat.tsx`                         | User click to dispatch start             |
| 2_ipc_to_backend        | `vsCodeApi.ts` → `CommandHandler.ts` | postMessage transit time                 |
| 3_session_history_load  | `AiService.ts`                       | `getSession()` + `getMessages()`         |
| 4_prompt_template_build | `AiService.ts`                       | `ChatPromptTemplate.fromMessages()`      |
| 5_model_init            | `AiService.ts`                       | `ChatOpenAI` instantiation (cold/cached) |
| 6_chain_build           | `AiService.ts`                       | `prompt.pipe(model).pipe(parser)`        |
| 7_api_call              | `AiService.ts`                       | `chain.invoke()` → OpenAI HTTP           |
| 8_mermaid_generation    | `AiService.ts`                       | `generateMermaidFromJSON()`              |
| 9_zod_validation        | `AiService.ts`                       | `AiPayloadSchema.safeParse()`            |
| 10_history_save         | `AiService.ts`                       | `addUserMessage()` + `addAIMessage()`    |
| 11_ipc_to_frontend      | `CommandHandler.ts`                  | `postMessage(AI_RESPONSE)`               |
| 12_state_update         | `diagramReducer.ts`                  | `dispatch(load_newDiagram)`              |
| 13_mermaid_render       | `MermaidRenderer.tsx`                | `mermaid.render()`                       |

---

## Files to Modify (Phase 1)

| File                                                  | Changes                                              |
| ----------------------------------------------------- | ---------------------------------------------------- |
| [NEW] `src/utils/PerformanceLogger.ts`                | Logger utility that writes to `.arkhe-perf.log`      |
| `src/services/AiService.ts`                           | Add step timing (3-10)                               |
| `src/handlers/CommandHandler.ts`                      | Add step timing (2, 11), orchestrate logging         |
| `webview-ui/src/features/chat/Aichat.tsx`             | Add step timing (1), send start timestamp to backend |
| `webview-ui/src/features/diagram/MermaidRenderer.tsx` | Add step timing (13), report back to backend         |
| `src/types/index.ts`                                  | Add `requestStartTime` to message payload            |

---

## Phase 2: Optimization Options (After Data Collection)

| Solution                                 | Expected Impact       | Risk   | Priority |
| ---------------------------------------- | --------------------- | ------ | -------- |
| Use `gpt-4o-mini`                        | -50% to -70% API time | Low    | High     |
| Truncate history (max 10 messages)       | -10% to -30% API time | Low    | High     |
| Optimize system prompt (remove examples) | -10% to -20% API time | Medium | Medium   |
| Preload model on activation              | Eliminate cold start  | Low    | Medium   |
| Add request cancellation                 | Better UX             | Low    | Low      |

---

## How to View Logs

After implementation, check:

```
{workspace_root}/.arkhe-perf.log
```

Each line is a complete JSON object for one request. Parse with:

```bash
cat .arkhe-perf.log | jq '.summary'
```

Or view in VS Code with JSON formatting.
