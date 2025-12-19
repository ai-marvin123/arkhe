import * as vscode from "vscode";

/**
 * Centralized configuration + secrets manager
 * - Secrets: SecretStorage (API Keys)
 * - Config: GlobalState (Provider / Model)
 */
export class ConfigManager {
  private static instance: ConfigManager;

  private context: vscode.ExtensionContext | null = null;

  // 🔑 Storage Keys
  private readonly SECRET_KEY_API = "arkhe.secrets.apiKey";
  private readonly CONFIG_KEY_PROVIDER = "arkhe.config.provider";
  private readonly CONFIG_KEY_MODEL = "arkhe.config.model";

  // ⚙️ Defaults
  private readonly DEFAULT_PROVIDER = "openai";
  private readonly DEFAULT_MODEL = "gpt-4o-mini";

  private constructor() {}

  // ──────────────────────────────────────────────
  // Singleton Access
  // ──────────────────────────────────────────────
  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  // ──────────────────────────────────────────────
  // Initialization
  // ──────────────────────────────────────────────
  public initialize(context: vscode.ExtensionContext): void {
    this.context = context;
  }

  private assertInitialized(): void {
    if (!this.context) {
      throw new Error(
        "ConfigManager has not been initialized. Call initialize(context) in activate()."
      );
    }
  }

  // ──────────────────────────────────────────────
  // Secrets (API Key)
  // ──────────────────────────────────────────────
  public async getApiKey(): Promise<string | undefined> {
    this.assertInitialized();
    return this.context!.secrets.get(this.SECRET_KEY_API);
  }

  public async setApiKey(apiKey: string): Promise<void> {
  this.assertInitialized();
  await this.context!.secrets.store(this.SECRET_KEY_API, apiKey.trim());

  console.log('[ConfigManager] API key stored in SecretStorage');
}

  // ──────────────────────────────────────────────
  // Non-Secret Config
  // ──────────────────────────────────────────────
  public getConfig(): { provider: string; model: string } {
    this.assertInitialized();

    const provider =
      this.context!.globalState.get<string>(this.CONFIG_KEY_PROVIDER) ??
      this.DEFAULT_PROVIDER;

    const model =
      this.context!.globalState.get<string>(this.CONFIG_KEY_MODEL) ??
      this.DEFAULT_MODEL;

    return { provider, model };
  }

  public async saveConfig(provider: string, model: string): Promise<void> {
    this.assertInitialized();
    await this.context!.globalState.update(
      this.CONFIG_KEY_PROVIDER,
      provider
    );
    await this.context!.globalState.update(
      this.CONFIG_KEY_MODEL,
      model
    );
  }

  // ──────────────────────────────────────────────
  // Status Helpers
  // ──────────────────────────────────────────────
  public async isConfigured(): Promise<boolean> {
    const apiKey = await this.getApiKey();
    return Boolean(apiKey && apiKey.trim().length > 0);
  }
}
