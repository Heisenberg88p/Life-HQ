import type { BaseEntity, Priority, ProjectStatus, TrafficLightStatus } from './common';

export interface Project extends BaseEntity {
  name: string;
  description?: string;
  lifeAreaId?: string;
  focusId?: string | null;
  status: ProjectStatus;
  priority: Priority;
  trafficLightStatus: TrafficLightStatus;
  targetDate?: string;
  completedAt?: string;
  pausedAt?: string;
  pauseReason?: string;
  pauseNote?: string;
  reviewDate?: string;
  reactivatedAt?: string;
  reactivationNote?: string;
}
