import type { MilestoneStatus, Priority, ProjectStatus, TaskStatus, TrafficLightStatus } from '../models/common';

export const PROJECT_STATUS_OPTIONS: ProjectStatus[] = ['planned', 'active', 'paused', 'completed'];

export const TASK_STATUS_OPTIONS: TaskStatus[] = ['open', 'in_progress', 'done'];

export const MILESTONE_STATUS_OPTIONS: MilestoneStatus[] = ['open', 'in_progress', 'done'];

export const PRIORITY_OPTIONS: Priority[] = ['low', 'medium', 'high', 'critical'];

export const TRAFFIC_LIGHT_STATUS_OPTIONS: TrafficLightStatus[] = ['green', 'yellow', 'red'];
