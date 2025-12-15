# 🔐 Settings & Security Workflow

**Goal:** Allow users to securely input their API Key and select an OpenAI Model.
**Security:** The API Key is stored in the OS Keychain via `SecretStorage`, never in plain text.

---

## 1. User Flow

### **Part 1: First-Time Setup (Onboarding)**

1.  **Launch:** User opens the extension for the first time.
2.  **Check:** System checks `SecretStorage`.
    - _Result:_ No API Key found.
3.  **UI:** Displays the **"Setup Arkhe"** screen (instead of the chat interface).
4.  **Action:** User fills in the form:
    - **Provider:** **OpenAI** (Default).
    - **API Key:** `sk-...` (Masked input).
    - **Model:** `gpt-4o-mini` (Default - Cheap & Fast).
5.  **Save:** User clicks **"Save & Start"**.
6.  **Storage:** System saves the Key to `SecretStorage` and Configuration to `GlobalState`.
7.  **Transition:** UI switches to the **"Chat"** screen.

### **Part 2: Re-configuration**

1.  **Context:** User is in the Chat screen.
2.  **Action:** User clicks the **⚙️ (Settings)** button in the top-right corner.
3.  **UI:** Switches back to **"Setup Arkhe"** screen (pre-filled with current Provider/Model; Key is hidden/masked).
4.  **Edit:** User changes Model to `gpt-4o`.
5.  **Save:** User clicks **"Save"**.
6.  **Transition:** Returns to the Chat screen with the new configuration.

---

## 2. Message Protocol (Frontend ↔ Backend)

### **A. Frontend → Backend (Commands)**

| Command             | Payload                                                         | Description                                                                  |
| :------------------ | :-------------------------------------------------------------- | :--------------------------------------------------------------------------- |
| **`GET_SETTINGS`**  | `null`                                                          | Requests current configuration status (to determine which screen to show).   |
| **`SAVE_SETTINGS`** | `{ provider: 'openai', model: 'gpt-4o-mini', apiKey?: string }` | Saves settings. `apiKey` is optional if the user is only changing the model. |

### **B. Backend → Frontend (Events)**

| Command               | Payload                                                                  | Description                                                    |
| :-------------------- | :----------------------------------------------------------------------- | :------------------------------------------------------------- |
| **`SETTINGS_STATUS`** | `{ isConfigured: boolean, config: { provider: string, model: string } }` | Returns configuration info (NEVER returns the actual API Key). |
| **`SETTINGS_SAVED`**  | `{ success: boolean }`                                                   | Confirmation that settings have been saved.                    |

---

## 3. Data Storage Strategy

### **SecretStorage (High Security)**

- **Key:** `arkhe.secrets.apiKey`
- **Value:** `sk-proj-...` (Actual API Key string)
- **Access:** Only readable by the Extension Backend.

### **GlobalState / Memento (Non-Sensitive Config)**

- **Key:** `arkhe.config.provider` -> Value: `'openai'`
- **Key:** `arkhe.config.model` -> Value: `'gpt-4o-mini'`
- **Access:** Readable by Backend to determine which model logic to use.

---

## 4. Default Options

These options should be hardcoded in the Frontend for selection.

**Provider: OpenAI**

- `gpt-4o-mini` (Recommended - Cheap, Fast, Capable)
- `gpt-3.5-turbo` (Legacy - Cheap)
- `gpt-4o` (Premium - Smartest)
