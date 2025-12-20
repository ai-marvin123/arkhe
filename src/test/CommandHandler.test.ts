import { CommandHandler } from '../handlers/CommandHandler';
import { aiService } from '../services/AiService';

// ---- MOCK aiService ----
jest.mock('../services/AiService', () => ({
  aiService: {
    generateStructure: jest.fn(),
    verifyApiKey: jest.fn(),
    updateModelConfiguration: jest.fn(),
    saveContext: jest.fn(),
  },
}));

// ---- MOCK FileService ----
jest.mock('../services/FileService', () => ({
  FileService: {
    saveDiagram: jest.fn(),
    loadDiagram: jest.fn(),
    scanDirectory: jest.fn(),
    resolveAbsolutePath: jest.fn(),
  },
}));

// ---- MOCK SessionManager ----
jest.mock('../managers/SessionManager', () => ({
  SessionManager: {
    getInstance: () => ({
      clearSession: jest.fn(),
    }),
  },
}));

// ---- MOCK ConfigManager ----
const mockSetApiKey = jest.fn();
const mockSaveConfig = jest.fn();
const mockGetApiKey = jest.fn();

jest.mock('../managers/ConfigManager', () => ({
  ConfigManager: {
    getInstance: () => ({
      setApiKey: mockSetApiKey,
      saveConfig: mockSaveConfig,
      isConfigured: jest.fn(),
      getConfig: jest.fn(),
      getApiKey: mockGetApiKey,
    }),
  },
}));

describe('CommandHandler (Priority 2)', () => {
  let postMessage: jest.Mock;
  let handler: CommandHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    postMessage = jest.fn();
    handler = new CommandHandler({ webview: { postMessage } } as any);
  });

  it('routes GENERATE_STRUCTURE and posts AI_RESPONSE', async () => {
    (aiService.generateStructure as jest.Mock).mockResolvedValue({
      type: 'DIAGRAM',
      message: 'fake response',
      data: {},
    });

    await handler.handle({
      command: 'GENERATE_STRUCTURE',
      payload: { sessionId: 'test-session', prompt: 'test prompt' },
    } as any);

    expect(aiService.generateStructure).toHaveBeenCalledWith(
      'test-session',
      'test prompt'
    );
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ command: 'AI_RESPONSE' })
    );
  });

  it('handles SAVE_SETTINGS and stores key', async () => {
    (aiService.verifyApiKey as jest.Mock).mockResolvedValue(true);

    await handler.handle({
      command: 'SAVE_SETTINGS',
      payload: { apiKey: 'sk-test', provider: 'openai', model: 'gpt-4o' },
    } as any);

    expect(aiService.verifyApiKey).toHaveBeenCalledWith('sk-test', 'gpt-4o');
    expect(mockSetApiKey).toHaveBeenCalledWith('sk-test');
    expect(mockSaveConfig).toHaveBeenCalledWith('openai', 'gpt-4o');
    expect(aiService.updateModelConfiguration).toHaveBeenCalled();
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ command: 'SETTINGS_SAVED' })
    );
  });
});
