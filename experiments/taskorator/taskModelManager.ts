export interface TaskoratorTask {
  taskId: string; // Unique identifier for the task
  name: string;
  todo: string;
  why: string;
  timeCreated: number; // UNIX timestamp in milliseconds
  lastUpdated: number; // UNIX timestamp in milliseconds
  timeEnd: number | null; // UNIX timestamp in milliseconds
  duration: number; // Estimated time to complete the task in minutes or hours
  overlord: string | null; // taskId of the parent task if it's part of a hierarchy
  repeat: RepeatOptions;
  status: TaskStatus; // Task status options
  stage: TaskStage; // Task stage options
  type: TaskType; // basically this defines size of project anyway
  subtype: TaskSubtype; // good if code, we can make it pretty...
  size: TaskSize; // we can delegate this to another owner or something, probably rename... its what action shall be taken ?
  owner: string; // for future use of who does whose tasks
  priority: number; // Task priority (1 to 10, for example)
  elo?: number;    // NEW: internal score (optional!)
  backupLink: string; // github, file location, web link, nothing
  imageUrl: string | null; // URL to the image file
  imageDataUrl: string | null; // Base64 representation of the image
  tags: string[]; // Array of tags associated with the task
}

// Utility method to generate unique IDs
export function getUniqueTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const TASK_ACTIONS = [
  'created',
  'updated',
  'completed',
  'archived',
  'deleted',
  'renewed',
  'seen',
  'activated',
  'moved',
  'split',
  'priorityIncreased',
  'priorityDecreased',
  'nameUpdated',
  'todoUpdated',
  'whyUpdated',
  'tagAdded',
  'tagRemoved',
  'imageUpdated',
  'backupLinkUpdated',
  'repeatUpdated',
  'timeEndUpdated',
  'durationUpdated',
  'statusUpdated',
  'typeUpdated',
  'subtypeUpdated',
  'sizeUpdated',
];

// so the UI can react to task updates a bit better
export interface UiTask extends TaskoratorTask {
  isSelected: boolean; // Affects how I render this task
  isRecentlyViewed: boolean; // Affects this task's appearance
  completionPercent: number; // Visual state of this task
  color: string; // probably based on age
  views: number; // can be used to have heatmap of what is popular in massive amount of tasks
  isRecentlyUpdated: boolean; // Show "updated" badge
  isRecentlyCreated: boolean; // Show "new" badge
  children: number; // Show expand icon
  completedChildren: number; // Disable complete action for example
  secondaryColor: string; // maybe priority color
  magnitude: number; // maybe priority here, ui size or something precalculated
  isConnectedToTree: boolean; // If this task is part of a tree structure
}

export function getDefaultUiTask(): UiTask {
  return {
    ...getDefaultTask(),
    isSelected: false,
    isRecentlyViewed: false,
    completionPercent: 0,
    color: '',
    views: 0,
    isRecentlyUpdated: false,
    isRecentlyCreated: false,
    children: 0,
    completedChildren: 0,
    secondaryColor: '',
    magnitude: 0,
    isConnectedToTree: false,
  };
}

export function getRootUiTask(): UiTask {
  return { ...getDefaultUiTask(), ...getRootTaskObject() };
}

export const maxPriority = 10;
export type TaskSize = 'do now' | 'split' | 'delegate';
export type TaskStage = 'seen' | 'completed' | 'todo' | 'archived' | 'deleted';
export type TaskStatus = 'active' | 'inactive';
export type RepeatOptions =
  | 'once'
  | 'never'
  | 'half-hourly'
  | 'hourly'
  | 'half-daily'
  | 'daily'
  | 'weekly'
  | 'half-monthly'
  | 'monthly'
  | 'three-monthly'
  | 'half-yearly'
  | 'yearly';

/**
 * task type guesser:
 * if "Task name caps"- project
 * "task name" - todo
 * if TASK NAME -???
 */
export type TaskType =
  | ''
  | 'code'
  | 'idea'
  | 'note'
  | 'todo'
  | 'checklist'
  | 'tree' // decision tree
  | 'flowchart'
  | 'task'
  | 'next'
  | 'job'
  | 'feature'
  | 'schedule'
  | 'project'; // never ends, can be considered completed if all inside completed, buy maybe not
export type TaskSubtype =
  | ''
  | 'js'
  | 'ts'
  | 'html'
  | 'css'
  | 'sound'
  | 'android'
  | 'angular'
  | 'nodejs'
  | 'java'
  | 'text'
  | 'list';

export const ROOT_TASK_ID = '128';
export const ROOT_TASK_NAME = 'Primarch';
export const ROOT_TASK_DESCRIPTION = 'Legends never die!';

export function getDefaultTask(): TaskoratorTask {
  const now = Date.now(); // Current time in milliseconds
  return {
    taskId: '0',
    name: '',
    todo: '',
    why: '',
    timeCreated: now,
    lastUpdated: now,
    timeEnd: null,
    duration: 0,
    overlord: ROOT_TASK_ID,
    repeat: 'once',
    status: 'active',
    stage: 'todo',
    type: 'todo',
    subtype: 'list',
    size: 'do now',
    owner: '',
    priority: 5,
    backupLink: '',
    imageUrl: '',
    imageDataUrl: '',
    tags: [],
  };
}

export function getRootTaskObject(): TaskoratorTask {
  const now = Date.now(); // Current time in milliseconds
  return {
    taskId: ROOT_TASK_ID,
    name: ROOT_TASK_NAME,
    todo: '',
    why: ROOT_TASK_DESCRIPTION,
    timeCreated: now,
    lastUpdated: now,
    timeEnd: null,
    duration: 0,
    overlord: null,
    repeat: 'once',
    status: 'active',
    stage: 'completed',
    type: 'todo',
    subtype: 'list',
    size: 'do now',
    owner: '',
    priority: 5,
    backupLink: '',
    imageUrl: '',
    imageDataUrl: '',
    tags: [],
  };
}

export const taskTableName = 'tasks_table';
export const sqlCreateTable = `CREATE TABLE ${taskTableName} (
  taskId INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  todo TEXT NOT NULL,
  why TEXT NOT NULL,
  timeCreated TIMESTAMP NOT NULL,
  timeEnd TIMESTAMP,
  lastUpdated TIMESTAMP,
  duration INTEGER NOT NULL,
  overlord INTEGER,
  repeat TEXT NOT NULL,
  status TEXT NOT NULL,
  stage TEXT NOT NULL,
  type TEXT NOT NULL,
  subtype TEXT NOT NULL,
  size TEXT NOT NULL,
  owner TEXT NOT NULL,
  priority INTEGER NOT NULL,
  backupLink TEXT NOT NULL,
  imageUrl TEXT,
  imageDataUrl TEXT,
  tags TEXT NOT NULL
);
`;
