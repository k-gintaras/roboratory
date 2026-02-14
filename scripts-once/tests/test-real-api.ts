import { config } from 'dotenv';
import { AiApiService } from '../../services-reuse/ai-api-service';

config();

async function testRealApi() {
  const service = new AiApiService();

  console.log('🚀 Testing real API calls...\n');

  try {
    console.log('📤 Calling /conversation endpoint...');
    const conversationResponse = await service.callConversation({
      assistantId: '097ab4e4-4f39-4a98-95d2-9362531d3511',
      userId: '',
      chatId: '',
      sessionId: '',
      prompt: 'hi',
    });

    console.log('✅ Conversation API Response:');
    console.log(JSON.stringify(conversationResponse, null, 2));
  } catch (error) {
    console.error('❌ Conversation API Error:');
    console.error(error);
  }

  console.log('\n---\n');

  try {
    console.log('📤 Calling /prompt endpoint...');
    const promptResponse = await service.callPrompt({
      id: '097ab4e4-4f39-4a98-95d2-9362531d3511',
      prompt: 'What is the capital of France?',
    });

    console.log('✅ Prompt API Response:');
    console.log(JSON.stringify(promptResponse, null, 2));
  } catch (error) {
    console.error('❌ Prompt API Error:');
    console.error(error);
  }
}

testRealApi();
