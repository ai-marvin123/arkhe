import { InMemoryChatMessageHistory } from '@langchain/core/chat_history';

export class SessionManager {
  private static instance: SessionManager;

  private sessions = new Map<string, InMemoryChatMessageHistory>();

  private constructor() {}

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  getSession(id: string): InMemoryChatMessageHistory {
    if (!this.sessions.has(id)) {
      this.sessions.set(id, new InMemoryChatMessageHistory());
    }
    return this.sessions.get(id)!;
  }

  clearSession(id: string): void {
    this.sessions.delete(id);
  }
}
