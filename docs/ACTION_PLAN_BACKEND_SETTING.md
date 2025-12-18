# ✅ Backend Implementation Checklist: Settings & Security

## Phase 1: Storage Infrastructure (`ConfigManager`)

**File:** `src/managers/ConfigManager.ts`

- [ ] **Create Class**: Implement `ConfigManager` as a Singleton class.
- [ ] **Define Constants**:
- [ ] `SECRET_KEY_API = 'arkhe.secrets.apiKey'`
- [ ] `CONFIG_KEY_PROVIDER = 'arkhe.config.provider'`
- [ ] `CONFIG_KEY_MODEL = 'arkhe.config.model'`

- [ ] **Implement `initialize(context)**`: Store `vscode.ExtensionContext` reference.
- [ ] **Implement `getApiKey()**`: Read from `context.secrets.get()`.
- [ ] **Implement `setApiKey(key)**`: Write to `context.secrets.store()`.
- [ ] **Implement `getConfig()**`:
- [ ] Read from `context.globalState`.
- [ ] Return default `{ provider: 'openai', model: 'gpt-4o-mini' }` if undefined.

- [ ] **Implement `saveConfig(provider, model)**`: Update `context.globalState`.
- [ ] **Implement `isConfigured()**`: Return `true`if API Key exists, else`false`.

## Phase 2: Command Handling (`CommandHandler`)

**File:** `src/handlers/CommandHandler.ts`

- [ ] **Handle `GET_SETTINGS**`:
- [ ] Call `ConfigManager.isConfigured()`.
- [ ] Call `ConfigManager.getConfig()`.
- [ ] **Security**: Return payload _without_ the raw API Key.
- [ ] Send `SETTINGS_STATUS` to frontend.

- [ ] **Handle `SAVE_SETTINGS**`:
- [ ] Extract `apiKey`, `provider`, `model` from payload.
- [ ] If `apiKey` is provided, call `ConfigManager.setApiKey()`.
- [ ] Call `ConfigManager.saveConfig()` for provider/model.
- [ ] **Trigger**: Call `AiService.updateModelConfiguration()` to refresh the instance.
- [ ] Send `SETTINGS_SAVED` `{ success: true }` to frontend.

## Phase 3: AI Service Integration (`AiService`)

**File:** `src/services/AiService.ts`

- [ ] **Remove Hardcoded Env**: Delete top-level `new ChatOpenAI(...)` instantiation using `process.env`.
- [ ] **Add State**: Add `private chatModel: ChatOpenAI | null = null`.
- [ ] **Implement `getChatModel()**`:
- [ ] Check if `this.chatModel` exists.
- [ ] If null, fetch key via `ConfigManager.getApiKey()`.
- [ ] Throw error if key is missing.
- [ ] Instantiate `ChatOpenAI` with dynamic key/model and cache it.

- [ ] **Implement `updateModelConfiguration()**`:
- [ ] Set `this.chatModel = null` to force re-initialization on next request.

- [ ] **Update Usage**: Refactor `generateStructure` and `analyzeDrift` to use `await this.getChatModel()` instead of the global variable.

## Phase 4: Initialization Wiring

**File:** `src/extension.ts`

- [ ] **Activate ConfigManager**: Call `ConfigManager.getInstance().initialize(context)` at the very beginning of the `activate()` function.

## Phase 5: Verification & Testing

- [ ] **Fresh Install**: Verify `GET_SETTINGS` returns `isConfigured: false` initially.
- [ ] **Security Check**: Ensure API Key is never printed to console logs or sent back to Frontend.
- [ ] **Save Flow**: Verify saving a key allows the AI to generate a diagram.
- [ ] **Model Switch**: Change model to `gpt-4o`, verify `GlobalState` updates, and AI uses the new model.
- [ ] **Persistence**: Restart VS Code and ensure settings/keys are retained without re-login.
