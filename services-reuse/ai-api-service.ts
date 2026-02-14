import { config } from 'dotenv';

// Load environment variables
config();

// Models for Prompt endpoint
export interface PromptRequest {
  extraInstruction?: string;
  prompt: string;
  id: string; // Assistant ID
}

export interface PromptResponse {
  answer: string;
}

// Models for Conversation endpoint
export interface ConversationRequest {
  assistantId: string;
  userId?: string;
  chatId?: string;
  sessionId?: string;
  prompt: string;
}

export interface ConversationResponse {
  assistantId: string;
  userId: string;
  chatId: string;
  sessionId: string;
  responseType: string;
  answer: string;
}

/**
 * Service for communicating with the AI API server
 */
export class AiApiService {
  private apiBaseUrl: string;

  constructor(apiBaseUrl?: string) {
    this.apiBaseUrl = apiBaseUrl || process.env.AI_API_BASE_URL || 'http://localhost:3001';
  }

  /**
   * Call the /prompt endpoint to get a single prompt response
   */
  async callPrompt(request: PromptRequest): Promise<PromptResponse> {
    console.log('Calling /prompt endpoint with URL:', `${this.apiBaseUrl}/prompt`);
    console.log('Prompt request:', JSON.stringify(request, null, 2));
    
    const response = await fetch(`${this.apiBaseUrl}/prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    console.log('Prompt response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Prompt error data:', errorData);
      throw new Error(
        `Prompt API failed with status ${response.status}: ${errorData.error || response.statusText}`
      );
    }

    const responseData = await response.json();
    console.log('Prompt response data:', responseData);
    return responseData;
  }

  /**
   * Call the /conversation endpoint to get a conversation response
   */
  async callConversation(
    request: ConversationRequest
  ): Promise<ConversationResponse> {
    // Build request body with all fields (using empty strings for undefined values)
    const body = {
      assistantId: request.assistantId,
      userId: request.userId ?? '',
      chatId: request.chatId ?? '',
      sessionId: request.sessionId ?? '',
      prompt: request.prompt,
    };

    console.log('Calling /conversation endpoint with URL:', `${this.apiBaseUrl}/conversation`);
    console.log('Conversation request body:', JSON.stringify(body, null, 2));

    const response = await fetch(`${this.apiBaseUrl}/conversation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('Conversation response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorText = await response.text().catch(() => '');
      console.error('Conversation error status:', response.status);
      console.error('Conversation error data:', errorData);
      console.error('Conversation error text:', errorText);
      throw new Error(
        `Conversation API failed with status ${response.status}: ${errorData.error || response.statusText}`
      );
    }

    const responseData = await response.json();
    console.log('Conversation response data:', responseData);
    return responseData;
  }
}

// Export a singleton instance for convenience
export const aiApiService = new AiApiService();
