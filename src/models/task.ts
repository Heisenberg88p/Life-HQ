import type { BaseEntity, Priority, TaskStatus } from './common';

export interface Task extends BaseEntity {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string;
  plannedDate?: string;
  completedAt?: string;
  projectId?: string;
  lifeSystemId?: string;
  lifeAreaId?: string;
}
