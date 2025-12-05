import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";

export class SessionManager {
  private sessions = new Map<string, InMemoryChatMessageHistory>();

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
