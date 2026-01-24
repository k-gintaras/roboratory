import { AiApiService, PromptRequest, ConversationRequest } from '../ai-api-service';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Mock Firebase Admin SDK
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn(),
  },
  auth: jest.fn(() => ({
    createCustomToken: jest.fn().mockResolvedValue('mock-token-123'),
  })),
}));

jest.mock('fs');
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

describe('AiApiService Integration Tests', () => {
  let service: AiApiService;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Set up environment variable
    process.env.GOOGLE_APPLICATION_CREDENTIALS = './ai-api-firebase-key.json';

    // Mock file system
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(
      JSON.stringify({
        type: 'service_account',
        project_id: 'test-project',
        private_key_id: 'test-key-id',
        private_key: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----',
        client_email: 'firebase-adminsdk@test-project.iam.gserviceaccount.com',
      })
    );

    service = new AiApiService();
  });

  describe('initialize()', () => {
    it('should initialize Firebase Admin SDK with service account key', async () => {
      await service.initialize();

      expect(fs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining('ai-api-firebase-key.json'),
        'utf-8'
      );
      expect(admin.initializeApp).toHaveBeenCalled();
    });

    it('should throw error if GOOGLE_APPLICATION_CREDENTIALS is not set', async () => {
      delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
      const newService = new AiApiService();

      await expect(newService.initialize()).rejects.toThrow(
        'GOOGLE_APPLICATION_CREDENTIALS environment variable is not set'
      );
    });

    it('should throw error if credentials file does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const newService = new AiApiService();

      await expect(newService.initialize()).rejects.toThrow(
        'Firebase service account key file not found'
      );
    });

    it('should not reinitialize if already initialized', async () => {
      await service.initialize();
      const initCallCount = (admin.initializeApp as jest.Mock).mock.calls.length;

      await service.initialize();

      expect((admin.initializeApp as jest.Mock).mock.calls.length).toBe(initCallCount);
    });
  });

  describe('callPrompt()', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should call the /prompt endpoint with correct headers and body', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ answer: 'Paris is the capital of France.' }),
      });
      global.fetch = mockFetch;

      const request: PromptRequest = {
        id: 'assistant-123',
        prompt: 'What is the capital of France?',
        extraInstruction: 'Be concise.',
      };

      const response = await service.callPrompt(request);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://192.168.4.41:3001/prompt',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: 'Bearer mock-token-123',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        })
      );

      expect(response.answer).toBe('Paris is the capital of France.');
    });

    it('should throw error when API returns non-ok status', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({ error: 'Unauthorized' }),
        statusText: 'Unauthorized',
      });
      global.fetch = mockFetch;

      const request: PromptRequest = {
        id: 'assistant-123',
        prompt: 'What is the capital of France?',
      };

      await expect(service.callPrompt(request)).rejects.toThrow(
        'Prompt API failed with status 401'
      );
    });

    it('should handle API response errors gracefully', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
        statusText: 'Internal Server Error',
      });
      global.fetch = mockFetch;

      const request: PromptRequest = {
        id: 'assistant-123',
        prompt: 'What is the capital of France?',
      };

      await expect(service.callPrompt(request)).rejects.toThrow(
        'Prompt API failed with status 500'
      );
    });
  });

  describe('callConversation()', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should call the /conversation endpoint with all fields', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          assistantId: 'assistant-123',
          userId: 'user-456',
          chatId: 'chat-789',
          sessionId: 'session-012',
          responseType: 'text',
          answer: 'Programming is fun!',
        }),
      });
      global.fetch = mockFetch;

      const request: ConversationRequest = {
        assistantId: 'assistant-123',
        userId: 'user-456',
        chatId: 'chat-789',
        sessionId: 'session-012',
        prompt: 'Tell me a programming joke',
      };

      const response = await service.callConversation(request);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://192.168.4.41:3001/conversation',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: 'Bearer mock-token-123',
            'Content-Type': 'application/json',
          },
        })
      );

      expect(response.answer).toBe('Programming is fun!');
    });

    it('should handle null optional fields correctly', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          assistantId: 'assistant-123',
          userId: null,
          chatId: 'chat-789',
          sessionId: 'session-012',
          responseType: 'text',
          answer: 'Response',
        }),
      });
      global.fetch = mockFetch;

      const request: ConversationRequest = {
        assistantId: 'assistant-123',
        prompt: 'Test prompt',
      };

      const response = await service.callConversation(request);

      // Verify null fields are passed
      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.userId).toBeNull();
      expect(body.chatId).toBeNull();
      expect(body.sessionId).toBeNull();

      expect(response.answer).toBe('Response');
    });

    it('should throw error when API returns non-ok status', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: jest.fn().mockResolvedValue({ error: 'Forbidden' }),
        text: jest.fn().mockResolvedValue(''),
        statusText: 'Forbidden',
      });
      global.fetch = mockFetch;

      const request: ConversationRequest = {
        assistantId: 'assistant-123',
        prompt: 'Test prompt',
      };

      await expect(service.callConversation(request)).rejects.toThrow(
        'Conversation API failed with status 403'
      );
    });
  });

  describe('Custom API URL', () => {
    it('should use custom API URL when provided', async () => {
      const customUrl = 'http://localhost:3000';
      const customService = new AiApiService(customUrl);
      await customService.initialize();

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ answer: 'Test' }),
      });
      global.fetch = mockFetch;

      const request: PromptRequest = {
        id: 'test',
        prompt: 'Test prompt',
      };

      await customService.callPrompt(request);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/prompt',
        expect.any(Object)
      );
    });
  });
});
