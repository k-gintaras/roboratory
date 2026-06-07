/**
 * Fetch All Tasks from Taskorator Firebase
 *
 * This script uses Firebase Admin SDK to fetch all tasks for a specific user
 * from the Taskorator application.
 *
 * Usage:
 *   npx ts-node experiments/taskorator/fetch-all-tasks.ts
 *   npx ts-node experiments/taskorator/fetch-all-tasks.ts --output tasks.json
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { getEnv, resolveProjectPath } from '../../agent/env-helper';

// Types based on the Angular service
interface TaskoratorTask {
  taskId: string;
  overlord?: string;
  stage?: 'todo' | 'in-progress' | 'completed' | 'deleted';
  title?: string;
  description?: string;
  timeCreated?: any;
  timeUpdated?: any;
  [key: string]: any;
}

/**
 * Initialize Firebase Admin with service account
 */
function initializeFirebase(): admin.app.App {
  const serviceKeyPath = getEnv('TASKORATOR_SERVICE_KEY');
  const absolutePath = resolveProjectPath(serviceKeyPath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Service key file not found at: ${absolutePath}`);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

/**
 * Fetch all tasks for a specific user
 */
async function fetchAllTasks(userId: string): Promise<TaskoratorTask[]> {
  const db = admin.firestore();
  const tasksRef = db.collection(`users/${userId}/tasks`);

  console.log(`📥 Fetching tasks for user: ${userId}`);

  const snapshot = await tasksRef.get();

  if (snapshot.empty) {
    console.log('No tasks found');
    return [];
  }

  const tasks: TaskoratorTask[] = [];
  snapshot.forEach((doc) => {
    tasks.push({
      taskId: doc.id,
      ...doc.data(),
    } as TaskoratorTask);
  });

  console.log(`✅ Fetched ${tasks.length} tasks`);
  return tasks;
}

/**
 * Main execution
 */
async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const outputIndex = args.indexOf('--output');
    const outputFile = outputIndex >= 0 ? args[outputIndex + 1] : null;

    // Initialize Firebase
    initializeFirebase();

    // Get user ID from environment
    const userId = getEnv('TASKORATOR_USER_ID');

    // Fetch tasks
    const tasks = await fetchAllTasks(userId);

    // Output results
    if (outputFile) {
      const outputPath = path.resolve(process.cwd(), outputFile);
      fs.writeFileSync(outputPath, JSON.stringify(tasks, null, 2));
      console.log(`💾 Tasks saved to: ${outputPath}`);
    } else {
      // Pretty print to console
      console.log('\n📋 Tasks:\n');
      console.log(JSON.stringify(tasks, null, 2));
    }

    // Print summary statistics
    console.log('\n📊 Summary:');
    console.log(`Total tasks: ${tasks.length}`);

    const byStage = tasks.reduce((acc, task) => {
      const stage = task.stage || 'unknown';
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(byStage).forEach(([stage, count]) => {
      console.log(`  ${stage}: ${count}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

// Export for use as a module
export { fetchAllTasks, initializeFirebase };
