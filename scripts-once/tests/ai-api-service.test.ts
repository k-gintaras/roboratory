import { config } from 'dotenv';
import { AiApiService, ConversationRequest, PromptRequest } from '../../services-reuse/ai-api-service';
import { beforeEach, describe, it, expect } from '@jest/globals';

// Load environment variables from .env
config();

describe('AiApiService Integration Tests', () => {
  let service: AiApiService;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    service = new AiApiService();
  });

  describe('callPrompt()', () => {
    it('should call the /prompt endpoint with correct headers and body', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: jest.fn().mockResolvedValue({ answer: 'Paris is the capital of France.' }),
      });
      global.fetch = mockFetch;

      const request: PromptRequest = {
        id: '097ab4e4-4f39-4a98-95d2-9362531d3511',
        prompt: 'What is the capital of France?',
        extraInstruction: 'Be concise.',
      };

      const response = await service.callPrompt(request);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/prompt',
        expect.objectContaining({
          method: 'POST',
          headers: {
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
        id: '097ab4e4-4f39-4a98-95d2-9362531d3511',
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
        id: '097ab4e4-4f39-4a98-95d2-9362531d3511',
        prompt: 'What is the capital of France?',
      };

      await expect(service.callPrompt(request)).rejects.toThrow(
        'Prompt API failed with status 500'
      );
    });
  });

  describe('callConversation()', () => {
    it('should call the /conversation endpoint with all fields', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: jest.fn().mockResolvedValue({
          assistantId: '097ab4e4-4f39-4a98-95d2-9362531d3511',
          userId: 'user-456',
          chatId: 'chat-789',
          sessionId: 'session-012',
          responseType: 'text',
          answer: 'Programming is fun!',
        }),
      });
      global.fetch = mockFetch;

      const request: ConversationRequest = {
        assistantId: '097ab4e4-4f39-4a98-95d2-9362531d3511',
        userId: 'user-456',
        chatId: 'chat-789',
        sessionId: 'session-012',
        prompt: 'Tell me a programming joke',
      };

      const response = await service.callConversation(request);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/conversation',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );

      expect(response.answer).toBe('Programming is fun!');
    });

    it('should handle null optional fields correctly', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: jest.fn().mockResolvedValue({
          assistantId: '097ab4e4-4f39-4a98-95d2-9362531d3511',
          userId: null,
          chatId: 'chat-789',
          sessionId: 'session-012',
          responseType: 'text',
          answer: 'Response',
        }),
      });
      global.fetch = mockFetch;

      const request: ConversationRequest = {
        assistantId: '097ab4e4-4f39-4a98-95d2-9362531d3511',
        prompt: 'Test prompt',
      };

      const response = await service.callConversation(request);

      // Verify empty string fields are passed
      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.userId).toBe('');
      expect(body.chatId).toBe('');
      expect(body.sessionId).toBe('');

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
        assistantId: '097ab4e4-4f39-4a98-95d2-9362531d3511',
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

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ answer: 'Test' }),
      });
      global.fetch = mockFetch;

      const request: PromptRequest = {
        id: '097ab4e4-4f39-4a98-95d2-9362531d3511',
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
