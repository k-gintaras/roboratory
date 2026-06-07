import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  updateDoc,
  writeBatch,
  getDoc,
  setDoc,
  getDocs,
  query,
  limit,
  orderBy,
  deleteDoc,
} from '@angular/fire/firestore';
import {
  ROOT_TASK_ID,
  TaskoratorTask,
  getDefaultTask,
} from '../../models/taskModelManager';
import { TaskApiStrategy } from '../../models/service-strategies/task-strategy.interface';
import { AuthService } from '../core/auth.service';
/**
 * Task API service for Firestore.
 * BEWARE task 128 is the root task. It should never be deleted.
 */
@Injectable({
  providedIn: 'root',
})
export class TaskApiService implements TaskApiStrategy {
  constructor(private firestore: Firestore, private authService: AuthService) {}

  private async getUserId(): Promise<string> {
    const userId = await this.authService.getCurrentUserId();
    if (!userId) {
      throw new Error('User not logged in');
    }
    return userId;
  }

  async getTasks(): Promise<TaskoratorTask[] | null> {
    const userId = await this.getUserId();
    throw new Error(
      'Can not just get tasks as non admin. Not implemented yet anyway.'
    );
  }

  private getTaskCollection(userId: string) {
    return collection(this.firestore, `users/${userId}/tasks`);
  }

  private handleError(method: string, error: unknown): void {
    console.warn(`TaskApiService.${method}:`, error);
  }

  private ensureOverlord(task: TaskoratorTask): TaskoratorTask {
    return { ...task, overlord: task.overlord ?? getDefaultTask().overlord };
  }

  async createTask(task: TaskoratorTask): Promise<TaskoratorTask | null> {
    const userId = await this.getUserId();

    const taskCollection = this.getTaskCollection(userId);
    const taskDocRef = doc(taskCollection);
    const newTask = { ...this.ensureOverlord(task), taskId: taskDocRef.id };

    try {
      await setDoc(taskDocRef, newTask);
      return newTask;
    } catch (error) {
      this.handleError('createTask', error);
      return null;
    }
  }

  async createTaskWithCustomId(
    task: TaskoratorTask,
    taskId: string
  ): Promise<TaskoratorTask | null> {
    const userId = await this.getUserId();

    const taskCollection = this.getTaskCollection(userId);
    const taskDocRef = doc(taskCollection, taskId);
    const newTask = { ...this.ensureOverlord(task), taskId };

    try {
      await setDoc(taskDocRef, newTask);
      return newTask;
    } catch (error) {
      this.handleError('createTaskWithCustomId', error);
      return null;
    }
  }

  async updateTask(task: TaskoratorTask): Promise<boolean> {
    const userId = await this.getUserId();

    if (!task.taskId) {
      console.warn('TaskApiService.updateTask: Missing task ID for update');
      return false;
    }

    const taskDocRef = doc(this.getTaskCollection(userId), task.taskId);
    const updatedTask = this.ensureOverlord(task);

    try {
      if (task.stage === 'deleted') {
        if (task.taskId === ROOT_TASK_ID) {
          this.handleError('updateTask', "can't delete root task!");
          return false;
        }
        await deleteDoc(taskDocRef);
        console.log(`Deleted task: ${task.taskId}`);
      } else {
        await updateDoc(taskDocRef, { ...updatedTask });
      }
      if (task.taskId === ROOT_TASK_ID) {
        if (task.stage !== 'completed') {
          console.warn(
            'TaskApiService.updateTask: Safety: Root task must always be completed'
          );
          this.handleError('updateTask', "can't delete root task!");
          return false;
        }
      }
      return true;
    } catch (error) {
      this.handleError('updateTask', error);
      return false;
    }
  }

  async getTaskById(taskId: string): Promise<TaskoratorTask | null> {
    const userId = await this.getUserId();

    const taskDocRef = doc(this.getTaskCollection(userId), taskId);

    try {
      const snapshot = await getDoc(taskDocRef);
      if (snapshot.exists()) {
        return { taskId: snapshot.id, ...snapshot.data() } as TaskoratorTask;
      } else {
        console.warn(`TaskApiService.getTaskById: Task ${taskId} not found`);
        // this is custom repair mechanism if task 128 deleted, which is root...
        // const t = getBaseTask();
        // this.createTaskWithCustomId(userId, t, '128');
        return null;
      }
    } catch (error) {
      this.handleError('getTaskById', error);
      return null;
    }
  }

  async getLatestTaskId(): Promise<string | null> {
    const userId = await this.getUserId();

    const taskCollection = this.getTaskCollection(userId);
    const latestTaskQuery = query(
      taskCollection,
      orderBy('timeCreated', 'desc'),
      limit(1)
    );

    try {
      const querySnapshot = await getDocs(latestTaskQuery);
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].id;
      }
      console.warn('TaskApiService.getLatestTaskId: No tasks found');
      return null;
    } catch (error) {
      this.handleError('getLatestTaskId', error);
      return null;
    }
  }

  async createTasks(tasks: TaskoratorTask[]): Promise<TaskoratorTask[] | null> {
    const userId = await this.getUserId();

    const batch = writeBatch(this.firestore);
    const taskCollection = this.getTaskCollection(userId);
    const newTasks: TaskoratorTask[] = [];

    try {
      tasks.forEach((task) => {
        const taskDocRef = doc(taskCollection, task.taskId || undefined);
        const newTask = { ...this.ensureOverlord(task), taskId: taskDocRef.id };
        batch.set(taskDocRef, newTask);
        newTasks.push(newTask);
      });

      await batch.commit();
      return newTasks;
    } catch (error) {
      this.handleError('createTasks', error);
      return null;
    }
  }

  async updateTasks(tasks: TaskoratorTask[]): Promise<boolean> {
    const userId = await this.getUserId();

    const batch = writeBatch(this.firestore);
    const taskCollection = this.getTaskCollection(userId);

    try {
      tasks.forEach((task) => {
        if (!task.taskId) {
          console.warn(`TaskApiService.updateTasks: Missing task ID for task`);
          return;
        }
        if (task.taskId === ROOT_TASK_ID) {
          console.warn(
            `TaskApiService.updateTasks: Safety: Can't mass update with root task`
          );
          return;
        }
        const taskDocRef = doc(taskCollection, task.taskId);
        batch.update(taskDocRef, { ...this.ensureOverlord(task) });
      });

      await batch.commit();
      return true;
    } catch (error) {
      this.handleError('updateTasks', error);
      return false;
    }
  }

  /**
   *
   * @param userId
   * @param overlordId
   * @returns super overlord if we pass task.overlord or overlord if we pass task.taskId
   */
  async getSuperOverlord(overlordId: string): Promise<TaskoratorTask | null> {
    const userId = await this.getUserId();

    const overlordDocRef = doc(this.getTaskCollection(userId), overlordId);

    try {
      const overlordSnapshot = await getDoc(overlordDocRef);
      if (!overlordSnapshot.exists()) {
        console.warn(
          `TaskApiService.getSuperOverlord: Overlord ${overlordId} not found`
        );
        return null;
      }

      const overlord = overlordSnapshot.data() as TaskoratorTask;
      if (!overlord.overlord) {
        console.warn(
          `TaskApiService.getSuperOverlord: Overlord ${overlordId} has no parent`
        );
        return null;
      }

      const superOverlordDocRef = doc(
        this.getTaskCollection(userId),
        overlord.overlord
      );
      const superOverlordSnapshot = await getDoc(superOverlordDocRef);

      return superOverlordSnapshot.exists()
        ? ({
            taskId: superOverlordSnapshot.id,
            ...superOverlordSnapshot.data(),
          } as TaskoratorTask)
        : null;
    } catch (error) {
      this.handleError('getSuperOverlord', error);
      return null;
    }
  }
}
