# Taskorator Experiment

This experiment provides tools to interact with the Taskorator Firebase database using the Admin SDK.

## Setup

The Firebase service account key and user ID are configured in the root `.env` file:

```bash
TASKORATOR_SERVICE_KEY=./taskorator-firebase-adminsdk.json
TASKORATOR_USER_ID=i7qcGO4XbohWdO4Pop9Yxvtjj0C2
```

## Available Scripts

### Fetch All Tasks

Retrieves all tasks for the configured user from Firebase.

**Basic usage** (prints to console):
```bash
npx ts-node experiments/taskorator/fetch-all-tasks.ts
```

**Save to file**:
```bash
npx ts-node experiments/taskorator/fetch-all-tasks.ts --output tasks.json
```

**Output includes:**
- All task data as JSON
- Summary statistics by stage (todo, in-progress, completed, etc.)

## Files

- **`fetch-all-tasks.ts`** - Script to fetch all tasks using Firebase Admin SDK
- **`task-api.service.ts`** - Angular service for client-side task operations
- **`general-api.service.ts`** - Angular service for general Firestore operations
- **`taskModelManager.ts`** - Task model definitions and utilities

## Database Structure

Tasks are stored in Firestore at: `users/{userId}/tasks/{taskId}`

Each task has:
- `taskId` - Unique identifier
- `overlord` - Parent task ID (for hierarchy)
- `stage` - Current stage (todo, in-progress, completed, deleted)
- `title` - Task title
- `description` - Task description
- `timeCreated` - Creation timestamp
- `timeUpdated` - Last update timestamp

## Helper Tools

The `/agent/env-helper.ts` provides utilities for accessing environment variables:

```typescript
import { getEnv, resolveProjectPath, ENV } from '../../agent/env-helper';

const userId = ENV.TASKORATOR_USER_ID;
const keyPath = resolveProjectPath(ENV.TASKORATOR_SERVICE_KEY);
```
