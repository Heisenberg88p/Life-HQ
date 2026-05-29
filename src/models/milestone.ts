import type { BaseEntity, MilestoneStatus } from './common';

export interface Milestone extends BaseEntity {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: MilestoneStatus;
  targetDate?: string;
  completedAt?: string;
}
