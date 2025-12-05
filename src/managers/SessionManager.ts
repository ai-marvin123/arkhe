class SessionManager {
  private sessions = new Map<string, any[]>();

  get(sessionId: string) {
    return this.sessions.get(sessionId) ?? [];
  }

  add(sessionId: string, message: { user: string; assistant: string }) {
    const history = this.get(sessionId);
    history.push(message);
    this.sessions.set(sessionId, history);
  }

  clearSession(sessionId: string) {
    this.sessions.set(sessionId, []);
  }
}

export const sessionManager = new SessionManager();
