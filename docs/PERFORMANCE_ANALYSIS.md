# Performance Analysis: Diagram Generation Optimization

## Summary

| Metric              | Before    | After      | Improvement |
| ------------------- | --------- | ---------- | ----------- |
| Response time       | 20s       | 8s         | **60%**     |
| System prompt       | 259 lines | 35 lines   | **85%**     |
| AI output tokens    | ~800      | ~500       | **37%**     |
| History per message | ~1.5KB    | ~0.5KB     | **67%**     |
| Orphan node bugs    | Possible  | Impossible | ✅          |

---

## Completed Optimizations

### 1. Performance Tracking ✅

**Files created/modified:**

- `src/utils/PerformanceLogger.ts` - Logger utility with `PerformanceTracker` and `StartupTracker`
- `src/handlers/CommandHandler.ts` - Request-level timing
- `src/services/AiService.ts` - Step-by-step timing (steps 3-10)
- `webview-ui/src/features/chat/Aichat.tsx` - Frontend timing
- `extension.ts` - Startup timing

**Log file:** `.arkhe-perf.log.json` (JSON array format)

### 2. System Prompt Optimization ✅

**Evolution:**
| Version | Lines | Description |
|---------|-------|-------------|
| `SYSTEM_PROMPT` | 259 | Original with 2 full examples |
| `SYSTEM_PROMPT_V2` | 40 | Shortened, 1 compact example |
| `SYSTEM_PROMPT_V3` | 35 | Nodes only, no edges in AI response |

**Current:** Using `SYSTEM_PROMPT_V3`

### 3. Auto-Edge Generation ✅

**Problem:** AI sometimes forgot edges, causing orphan nodes.

**Solution:** AI generates `nodes` only with `parentId`. Edges auto-generated in backend.

**Files modified:**

- `src/types/index.ts` - Made `edges` optional in schema
- `src/services/AiService.ts` - Added `generateEdgesFromNodes()` method

**Benefits:**

- Zero orphan nodes (guaranteed)
- Fewer output tokens
- Smaller history storage

### 4. History Storage Optimization ✅

**`minifyPayload()` now removes:**

- `mermaidSyntax` (regenerated from nodes)
- `edges` (regenerated from parentId)

**Result:** ~67% reduction in history size per message

---

## Future Optimizations (Not Implemented)

### 1. Remove JSON Mode

**Current:**

```typescript
modelKwargs: {
  response_format: {
    type: "json_object";
  }
}
```

**Proposal:** Remove JSON mode, parse from markdown code block.

**Potential impact:** -10% to -20% latency

**Risk:** May return invalid JSON. Need retry/fallback logic.

**Implementation:**

````typescript
function extractJsonFromResponse(raw: string): object {
  try {
    return JSON.parse(raw);
  } catch {}
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) return JSON.parse(match[1].trim());
  throw new Error("No valid JSON found");
}
````

---

### 2. History Truncation

**Problem:** Long sessions accumulate history, increasing token count.

**Solution:** Limit to last N messages (e.g., 10).

**Files to modify:** `SessionManager.ts` or `AiService.ts`

```typescript
const MAX_HISTORY = 10;
const historyMessages = (await history.getMessages()).slice(-MAX_HISTORY);
```

---

### 3. Model Selection

| Model           | Speed  | Quality | Use Case              |
| --------------- | ------ | ------- | --------------------- |
| `gpt-4o-mini`   | Fast   | Good    | Current default       |
| `gpt-3.5-turbo` | Faster | OK      | Simple diagrams       |
| `gpt-4o`        | Slow   | Best    | Complex architectures |

**Potential:** Add model selector based on complexity.

---

### 4. Request Cancellation

**Current:** No way to cancel long-running requests.

**Solution:** Use AbortController with LangChain.

```typescript
const controller = new AbortController();
const model = new ChatOpenAI({
  configuration: { signal: controller.signal },
});
```

---

### 5. Streaming (Low Priority)

**Note:** Not suitable for current use case. JSON must be complete before processing.

**Potential use:** Show "AI is thinking..." progress indicator.

---

## Performance Log Format

**Location:** `.arkhe-perf.log.json`

**Format:** JSON array (pretty-printed)

### Request Entry

```json
{
  "timestamp": "2026-01-11T14:00:00.000Z",
  "requestId": "req_abc123",
  "command": "GENERATE_STRUCTURE",
  "model": "gpt-4o-mini",
  "prompt": "Create a full-stack app...",
  "steps": {
    "2_ipc_to_backend": { "startTime": 0, "duration": 1 },
    "3_session_history_load": {
      "startTime": 1,
      "duration": 2,
      "messageCount": 0
    },
    "7_api_call": { "startTime": 50, "duration": 8000 },
    "8_mermaid_generation": {
      "startTime": 8050,
      "duration": 5,
      "nodeCount": 14,
      "edgeCount": 13
    }
  },
  "summary": {
    "totalTime": 8100,
    "apiCallTime": 8000,
    "apiCallPercent": "98.7%"
  },
  "status": "success"
}
```

### Startup Entry

```json
{
  "type": "STARTUP",
  "timestamp": "2026-01-11T14:00:00.000Z",
  "steps": {
    "1_panel_create": { "startTime": 0, "duration": 1 },
    "2_html_inject": { "startTime": 1, "duration": 1 },
    "3_handler_setup": { "startTime": 2, "duration": 0 },
    "4_first_message": { "startTime": 2, "duration": 200 }
  },
  "summary": { "totalTime": 202 }
}
```

---

## How to View Logs

```bash
# View all entries
cat .arkhe-perf.log.json | jq '.'

# View summaries only
cat .arkhe-perf.log.json | jq '.[].summary'

# Filter by command type
cat .arkhe-perf.log.json | jq '.[] | select(.command == "GENERATE_STRUCTURE")'
```
