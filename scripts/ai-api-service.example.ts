import { aiApiService, PromptRequest, ConversationRequest } from './ai-api-service';

/**
 * Example: Using the AI API Service from scripts
 * 
 * To use this in your own projects:
 * 1. Import the service from this scripts folder
 * 2. Call initialize() once at startup
 * 3. Use callPrompt() or callConversation() as needed
 */

async function examplePrompt() {
  await aiApiService.initialize();

  const promptRequest: PromptRequest = {
    id: 'my-assistant-id',
    prompt: 'What is the capital of France?',
    extraInstruction: 'Keep the answer concise.',
  };

  try {
    const response = await aiApiService.callPrompt(promptRequest);
    console.log('Prompt response:', response.answer);
  } catch (error) {
    console.error('Error calling prompt:', error);
  }
}

async function exampleConversation() {
  await aiApiService.initialize();

  const conversationRequest: ConversationRequest = {
    assistantId: 'my-assistant-id',
    prompt: 'Tell me a joke about programming',
    userId: 'user-123',
    chatId: 'chat-456',
    sessionId: 'session-789',
  };

  try {
    const response = await aiApiService.callConversation(conversationRequest);
    console.log('Conversation response:', response.answer);
  } catch (error) {
    console.error('Error calling conversation:', error);
  }
}

// Uncomment to run examples:
// examplePrompt();
// exampleConversation();
