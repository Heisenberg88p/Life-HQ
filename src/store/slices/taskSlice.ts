import type { Priority, TaskStatus } from '../../models/common';
import type { Task } from '../../models/task';

export interface TaskSlice {
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  updateTaskPriority: (id: string, priority: Priority) => void;
  completeTask: (id: string) => void;
}
