import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
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
  userId?: string | null;
  chatId?: string | null;
  sessionId?: string | null;
  prompt: string;
}

export interface ConversationResponse {
  assistantId: string;
  userId?: string;
  chatId: string;
  sessionId: string;
  responseType: string;
  answer: string;
}

/**
 * Service for communicating with the AI API server using Firebase Admin SDK authentication
 */
export class AiApiService {
  private apiBaseUrl = 'http://192.168.4.41:3001';
  private initialized = false;

  constructor(apiBaseUrl?: string) {
    if (apiBaseUrl) {
      this.apiBaseUrl = apiBaseUrl;
    }
  }

  /**
   * Initialize Firebase Admin SDK with service account key
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!credentialsPath) {
      throw new Error(
        'GOOGLE_APPLICATION_CREDENTIALS environment variable is not set. Please add it to your .env file.'
      );
    }

    // Resolve the path relative to the project root
    const resolvedPath = path.isAbsolute(credentialsPath)
      ? credentialsPath
      : path.resolve(process.cwd(), credentialsPath);

    if (!fs.existsSync(resolvedPath)) {
      throw new Error(
        `Firebase service account key file not found at: ${resolvedPath}`
      );
    }

    const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    this.initialized = true;
  }

  /**
   * Get a token from Firebase Admin SDK
   * Creates a custom token for service-to-service authentication
   * The API server verifies this with the same Firebase project
   */
  private async getAuthToken(): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Create custom token with claims
    const customToken = await admin.auth().createCustomToken('service-account', {
      canUseGpt: true,
      // Add any other claims your API needs
    });
    return customToken;
  }

  /**
   * Call the /prompt endpoint to get a single prompt response
   */
  async callPrompt(request: PromptRequest): Promise<PromptResponse> {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.apiBaseUrl}/prompt`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Prompt API failed with status ${response.status}: ${errorData.error || response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Call the /conversation endpoint to get a conversation response
   */
  async callConversation(
    request: ConversationRequest
  ): Promise<ConversationResponse> {
    const token = await this.getAuthToken();

    // Build request body with all fields (including null values for TSOA validation)
    const body = {
      assistantId: request.assistantId,
      userId: request.userId || null,
      chatId: request.chatId || null,
      sessionId: request.sessionId || null,
      prompt: request.prompt,
    };

    console.log('Conversation request body:', body);

    const response = await fetch(`${this.apiBaseUrl}/conversation`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorText = await response.text().catch(() => '');
      console.error('Conversation API error response:', errorText);
      throw new Error(
        `Conversation API failed with status ${response.status}: ${errorData.error || response.statusText}`
      );
    }

    return response.json();
  }
}

// Export a singleton instance for convenience
export const aiApiService = new AiApiService();
