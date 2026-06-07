/**
 * Environment Helper for Agent
 *
 * Simple utility to load and access environment variables.
 * Makes it easy for agents to access configuration across experiments.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env from project root
const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env');

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.warn('⚠️ No .env file found at:', envPath);
}

/**
 * Get an environment variable with optional default value
 */
export function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
}

/**
 * Get an environment variable as a required value (throws if missing)
 */
export function requireEnv(key: string): string {
  return getEnv(key);
}

/**
 * Get an environment variable as an optional value
 */
export function getEnvOptional(key: string): string | undefined {
  return process.env[key];
}

/**
 * Check if an environment variable is defined
 */
export function hasEnv(key: string): boolean {
  return process.env[key] !== undefined;
}

/**
 * Get all environment variables as an object
 */
export function getAllEnv(): Record<string, string | undefined> {
  return { ...process.env };
}

/**
 * Resolve a file path relative to project root
 * Useful for loading service account keys and other files referenced in .env
 */
export function resolveProjectPath(relativePath: string): string {
  return path.resolve(projectRoot, relativePath);
}

// Export commonly used environment variables
export const ENV = {
  // General
  NODE_ENV: getEnvOptional('NODE_ENV') || 'development',
  PORT: getEnvOptional('PORT') || '3000',

  // Paths
  DESKTOP_DIR: getEnvOptional('DESKTOP_DIR'),
  ROOT_DIR: getEnvOptional('ROOT_DIR'),

  // Database
  DATABASE_URL: getEnvOptional('DATABASE_URL'),
  POSTGRES_HOST: getEnvOptional('POSTGRES_HOST'),
  POSTGRES_PORT: getEnvOptional('POSTGRES_PORT'),
  POSTGRES_DB: getEnvOptional('POSTGRES_DB'),
  POSTGRES_USER: getEnvOptional('POSTGRES_USER'),
  POSTGRES_PASSWORD: getEnvOptional('POSTGRES_PASSWORD'),

  // Firebase / Google
  GOOGLE_APPLICATION_CREDENTIALS: getEnvOptional('GOOGLE_APPLICATION_CREDENTIALS'),

  // AI API
  AI_API_BASE_URL: getEnvOptional('AI_API_BASE_URL'),
  AI_API_ADMIN_ID: getEnvOptional('AI_API_ADMIN_ID'),

  // Taskorator
  TASKORATOR_SERVICE_KEY: getEnvOptional('TASKORATOR_SERVICE_KEY'),
  TASKORATOR_USER_ID: getEnvOptional('TASKORATOR_USER_ID'),

  // Music & Tagging
  MUSIC_TAGGING_SERVER: getEnvOptional('MUSIC_TAGGING_SERVER'),
  PRIVATE_TAGGING_SERVER: getEnvOptional('PRIVATE_TAGGING_SERVER'),
} as const;

export default ENV;
