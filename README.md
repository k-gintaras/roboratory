# Roboratory

A monorepo of experiments, shared packages, and apps for robotics and AI.

## Available Functionality

| Functionality | File | Function | Parameters | Returns |
|---|---|---|---|---|
| Call AI prompt endpoint | `scripts/ai-api-service.ts` | `callPrompt()` | `PromptRequest` | `PromptResponse` |
| Call AI conversation endpoint | `scripts/ai-api-service.ts` | `callConversation()` | `ConversationRequest` | `ConversationResponse` |
| PostgreSQL admin and CRUD | `services-reuse/postgres-service.ts` | `PostgresService` methods: `listDatabases`, `createDatabase`, `dropDatabase`, `createTable`, `insert`, `select`, `update`, `delete`, `close` | See method docs | Varies (Promise, array, void) |


