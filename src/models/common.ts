export type ProjectStatus = 'planned' | 'active' | 'paused' | 'completed';

export type TaskStatus = 'open' | 'in_progress' | 'done';

export type MilestoneStatus = 'open' | 'in_progress' | 'done';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type TrafficLightStatus = 'green' | 'yellow' | 'red';

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}
