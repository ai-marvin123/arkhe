### **0. Backend Architecture**

Refactor `src/` to this modular structure. Do not put business logic in `extension.ts`.

```text
src/
├── types/
│   └── index.ts          # Shared interfaces (StructureNode, AiPayload, etc.)
├── schemas/
│   └── validation.ts     # Zod schemas (Validation logic)
├── services/
│   ├── AiService.ts      # LangChain logic (Real AI integration)
│   └── MockService.ts    # Mock data provider (for dev/testing)
├── managers/
│   └── SessionManager.ts # LangChain History (Memory management)
├── handlers/
│   └── CommandHandler.ts # Switch-case logic (The "Router")
├── mocks/
│   ├── diagramMocks.ts   # Happy path data
│   ├── chatMocks.ts      # Text-only scenarios
│   └── edgeCaseMocks.ts  # Errors & Timeouts
└── extension.ts          # Entry point (Minimal setup)
```

### **Phase 1: Setup & Foundations (Day 1)**

**Goal:** Architecture setup, Research, Types.

#### **Setup**

- [ ] **Repo:** Create folders: `types`, `schemas`, `services`, `managers`, `handlers`, `mocks`.
- [ ] **Env:** Install `dotenv`. Create `.env` (Add `OPENAI_API_KEY` or `GOOGLE_API_KEY`).
- [ ] **Types:** Create `src/types/index.ts`. Copy interfaces from `IPC_PROTOCOL.md`.

#### **Research: LangChain**

- [ ] **Read:** LangChain JS Quickstart.
- [ ] **Focus:** `ChatOpenAI` / `ChatGoogleGenerativeAI`, `PromptTemplate`, `InMemoryChatMessageHistory`.
- [ ] **Lab:** Create `test-langchain.ts`. Run script: Input "Hello" -\> Console Log AI response.

#### **Research: Zod**

- [ ] **Read:** Zod Documentation.
- [ ] **Focus:** `z.object()`, `z.enum()`, `.safeParse()`.
- [ ] **Lab:** Create `test-zod.ts`. Define schema for `StructureNode`. Validate a raw JSON object.

#### **Dev: Infrastructure**

- [ ] Update `extension.ts` to load environment variables.
- [ ] Setup `panel.webview.onDidReceiveMessage` to delegate to `CommandHandler` (skeleton).

---

### **Phase 2: Core Logic (Memory & Mocks) (Day 2)**

**Goal:** State management & Robustness.

#### **Dev: Validation Schema**

- [ ] Create `src/schemas/validation.ts`.
- [ ] Define `StructureNodeSchema`: Use `z.enum(['FILE', 'FOLDER'])`.
- [ ] Define `AiResponseSchema`: Validate `mermaidSyntax` and `jsonStructure`.

#### **Dev: Session Manager**

- [ ] Create `src/managers/SessionManager.ts`.
- [ ] Implement class `SessionManager`.
- [ ] Store: `private sessions = new Map<string, ChatMessageHistory>();`.
- [ ] Method: `getSession(id)` -\> Returns history instance (create if not exists).
- [ ] Method: `clearSession(id)` -\> Deletes key from Map.

#### **Dev: Mock Service**

- [ ] Create `src/mocks/` files (`diagramMocks.ts`, `chatMocks.ts`, `edgeCaseMocks.ts`) with prepared data.
- [ ] Create `src/services/MockService.ts`.
- [ ] Method: `getMockResponse(prompt)` -\> Returns specific mock data based on keywords (e.g., "error", "nestjs").

#### **Dev: Command Handler Skeleton**

- [ ] Create `src/handlers/CommandHandler.ts`.
- [ ] Move `switch(message.command)` logic from `extension.ts` here.
- [ ] **Refactor:** `extension.ts` should only instantiate and call `CommandHandler.handle(message)`.

---

### **Phase 3: Intelligence & Integration (Day 3)**

**Goal:** Real AI connection & Wiring.

#### **Dev: AI Service**

- [ ] Create `src/services/AiService.ts`.
- [ ] Setup: Initialize `ChatModel` (temperature: 0).
- [ ] Prompt: Create System Prompt ("You are an architect. Output strictly JSON...").
- [ ] Method: `generateStructure(sessionId, userPrompt)`.
  - Retrieve History from `SessionManager`.
  - Call Model with `PromptTemplate`.
  - Parse Output (JSON).
  - **Critical:** Validate output using `src/schemas/validation.ts`.

#### **Dev: Wiring (Integration)**

- [ ] Update `src/handlers/CommandHandler.ts`.
- [ ] Case `GENERATE_STRUCTURE`:
  - Send `PROCESSING_STATUS` (`analyzing` -\> `generating`).
  - Call `AiService.generateStructure`.
  - Send `AI_RESPONSE` (Type: `DIAGRAM`).
- [ ] Case `RESET_SESSION`:
  - Call `SessionManager.clearSession`.
- [ ] **Error Handling:** Wrap logic in `try/catch`. Send `AI_RESPONSE` (Type: `TEXT`) or `ERROR` event on failure.

#### **Backend - Frontend Integration**

- [ ] Run Extension (F5).
- [ ] Trigger command with `sessionId` from Frontend.
- [ ] Verify: AI generates correct structure and remembers context (follow-up questions).
- [ ] Verify: Edge cases (invalid JSON, network error) trigger fallback UI.
