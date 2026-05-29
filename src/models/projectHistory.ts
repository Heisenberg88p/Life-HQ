import type { BaseEntity } from './common';

export type ProjectHistoryEntryType =
  | 'created'
  | 'status_changed'
  | 'priority_changed'
  | 'paused'
  | 'reactivated'
  | 'completed'
  | 'task_linked'
  | 'milestone_updated'
  | 'note_added';

export interface ProjectHistoryEntry extends BaseEntity {
  projectId: string;
  type: ProjectHistoryEntryType;
  date: string;
  description: string;
  taskId?: string;
  milestoneId?: string;
  oldValue?: string;
  newValue?: string;
  note?: string;
}
