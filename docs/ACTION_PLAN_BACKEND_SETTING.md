# ACTION_PLAN_BACKEND_SETTING.md

## 🎯 Objective

Implement a secure configuration management system that stores sensitive data (API Keys) in VS Code's `SecretStorage` and non-sensitive preferences (Provider, Model) in `GlobalState`. Update the `AiService` to consume these dynamic settings instead of hardcoded `.env` variables.

---

## 📅 Phase 1: Storage Infrastructure (`ConfigManager`)

**Goal:** Create a centralized manager to handle read/write operations for Secrets and Global State.

### 1. Create `src/managers/ConfigManager.ts`

- **Pattern:** Singleton (to maintain reference to `ExtensionContext`).
- **Dependencies:** `vscode.ExtensionContext`.
- **Key Constants:**
- `SECRET_KEY_API`: `'arkhe.secrets.apiKey'`
- `CONFIG_KEY_PROVIDER`: `'arkhe.config.provider'`
- `CONFIG_KEY_MODEL`: `'arkhe.config.model'`

### 2. Implement Methods

- **`initialize(context: vscode.ExtensionContext)`**: Capture the context to access storage APIs.
- **`getApiKey(): Promise<string | undefined>`**: Fetch from `context.secrets.get()`.
- **`setApiKey(key: string): Promise<void>`**: Write to `context.secrets.store()`.
- **`getConfig(): { provider: string, model: string }`**:
- Fetch from `context.globalState.get()`.
- Default to `{ provider: 'openai', model: 'gpt-4o-mini' }` if undefined.

- **`saveConfig(provider: string, model: string): Promise<void>`**: Update `globalState`.
- **`isConfigured(): Promise<boolean>`**: Check if API Key exists in storage.

---

## 📅 Phase 2: Command Handling (`CommandHandler`)

**Goal:** Connect Frontend events to the `ConfigManager` based on the defined Message Protocol.

### 1. Handle `GET_SETTINGS`

- **Action:**
- Call `ConfigManager.isConfigured()`.
- Call `ConfigManager.getConfig()`.

- **Response (`SETTINGS_STATUS`):**
- Payload: `{ isConfigured: boolean, config: { provider, model } }`.
- _Security Note:_ **NEVER** return the raw API Key in this payload.

### 2. Handle `SAVE_SETTINGS`

- **Action:**
- Extract `apiKey` (optional), `provider`, `model` from payload.
- If `apiKey` is present: Call `ConfigManager.setApiKey(apiKey)`.
- Call `ConfigManager.saveConfig(provider, model)`.
- **Crucial:** Trigger a reload/re-initialization of the `AiService` model instance (see Phase 3).

- **Response (`SETTINGS_SAVED`):**
- Payload: `{ success: true }`.

---

## 📅 Phase 3: AI Service Integration (`AiService`)

**Goal:** Remove hardcoded `.env` dependencies and make the Chat Model dynamic.

### 1. Refactor `AiService.ts`

- **Remove:** Top-level instantiation of `chatModel` (e.g., `const chatModel = new ChatOpenAI(...)`).
- **Add State:** `private chatModel: ChatOpenAI | null = null;`
- **Implement `getChatModel()`:**
- Check if `this.chatModel` exists.
- If not, fetch credentials from `ConfigManager`:

```typescript
const apiKey = await ConfigManager.getInstance().getApiKey();
const config = ConfigManager.getInstance().getConfig();
```

- Validation: If no API Key, throw a clear error ("API Key not configured").
- Instantiate `ChatOpenAI` with the fetched `apiKey` and `modelName`.
- Cache the instance.

### 2. Implement `updateModelConfiguration()`

- Method to force `this.chatModel = null`.
- Called by `CommandHandler` immediately after `SAVE_SETTINGS` to ensure the next request uses the new key/model.

---

## 📅 Phase 4: Initialization Wiring (`extension.ts`)

**Goal:** Bootstrap the `ConfigManager` when VS Code starts.

### 1. Update `activate(context: vscode.ExtensionContext)`

- Import `ConfigManager`.
- Call `ConfigManager.getInstance().initialize(context)` **before** initializing `CommandHandler` or `Panel`.

---

## 🧪 Testing Checklist

1. **Fresh Install:**

- Verify `GET_SETTINGS` returns `isConfigured: false`.
- Verify AI commands fail gracefully with a "Please setup API Key" message.

2. **Saving Settings:**

- Input API Key & save.
- Verify `SecretStorage` has the key (via debugging, not UI).
- Verify `AiService` can now generate a diagram.

3. **Changing Model:**

- Change from `gpt-4o-mini` to `gpt-4o`.
- Verify `GlobalState` updates.
- Verify the next AI request uses the new model (log the model name in `AiService`).

4. **Restart:**

- Reload Window.
- Verify settings persist (API Key still works without re-entering).
