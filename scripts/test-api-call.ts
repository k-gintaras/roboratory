import { aiApiService, PromptRequest, ConversationRequest } from './ai-api-service';

/**
 * Simple script to test if you can reach your AI API
 * Run with: npx ts-node scripts/test-api-call.ts
 */

const promptAssistantId = '097ab4e4-4f39-4a98-95d2-9362531d3511';

async function testPromptEndpoint() {
  console.log('\n🚀 Testing /prompt endpoint...');
  try {
    await aiApiService.initialize();

    const request: PromptRequest = {
      id: promptAssistantId,
      prompt: 'What is 2+2?',
    };

    console.log('📤 Sending prompt request:', request);
    const response = await aiApiService.callPrompt(request);
    console.log('✅ Success! Response:', response);
    return true;
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    return false;
  }
}

async function testConversationEndpoint() {
  console.log('\n🚀 Testing /conversation endpoint...');
  try {
    await aiApiService.initialize();

    const request: ConversationRequest = {
      assistantId: promptAssistantId,
      prompt: 'Tell me a joke',
      userId: 'test-user',
    };

    console.log('📤 Sending conversation request:', request);
    const response = await aiApiService.callConversation(request);
    console.log('✅ Success! Response:', response);
    return true;
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    return false;
  }
}

async function main() {
  console.log('🧪 AI API Service Integration Test\n');
  console.log('API URL: http://192.168.4.41:3001');
  console.log('Using Firebase service account from: ' + process.env.GOOGLE_APPLICATION_CREDENTIALS);

  const promptSuccess = await testPromptEndpoint();
  const conversationSuccess = await testConversationEndpoint();

  console.log('\n📊 Summary:');
  console.log(`  /prompt endpoint: ${promptSuccess ? '✅ OK' : '❌ FAILED'}`);
  console.log(`  /conversation endpoint: ${conversationSuccess ? '✅ OK' : '❌ FAILED'}`);

  if (!promptSuccess || !conversationSuccess) {
    console.log(
      '\n💡 Troubleshooting tips:\n' +
        '  1. Make sure your API server is running at http://192.168.4.41:3001\n' +
        '  2. Check GOOGLE_APPLICATION_CREDENTIALS in .env file\n' +
        '  3. Verify Firebase service account key is valid\n' +
        '  4. Check network connectivity to the API server'
    );
    process.exit(1);
  }

  console.log('\n🎉 All tests passed!');
}

main().catch(console.error);
