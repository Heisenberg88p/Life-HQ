import type { BaseEntity } from './common';

export type ProjectHistoryEntryType =
  | 'created'
  | 'updated'
  | 'status_changed'
  | 'priority_changed'
  | 'traffic_light_changed'
  | 'target_date_changed'
  | 'paused'
  | 'reactivated'
  | 'completed'
  | 'task_created'
  | 'task_completed'
  | 'task_linked'
  | 'milestone_created'
  | 'milestone_completed'
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
