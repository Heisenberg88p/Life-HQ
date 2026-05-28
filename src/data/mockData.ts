import type { LifeArea } from '../models/lifeArea';
import type { Milestone } from '../models/milestone';
import type { Project } from '../models/project';
import type { ProjectHistoryEntry } from '../models/projectHistory';
import type { Task } from '../models/task';

const now = new Date().toISOString();

export const mockLifeAreas: LifeArea[] = [
  { id: 'la-1', name: 'Health', description: 'Physical and mental resilience', status: 'green', priority: 'high', createdAt: now, updatedAt: now },
  { id: 'la-2', name: 'Career', description: 'Professional growth and impact', status: 'yellow', priority: 'critical', createdAt: now, updatedAt: now },
];

export const mockProjects: Project[] = [
  { id: 'p-1', name: 'Fitness Routine', lifeAreaId: 'la-1', status: 'active', priority: 'high', trafficLightStatus: 'green', createdAt: now, updatedAt: now },
  { id: 'p-2', name: 'Portfolio Refresh', lifeAreaId: 'la-2', status: 'paused', priority: 'critical', trafficLightStatus: 'red', pausedAt: now, pauseReason: 'Scope reset', createdAt: now, updatedAt: now },
];

export const mockTasks: Task[] = [
  { id: 't-1', title: 'Morning workout block', status: 'open', priority: 'high', plannedDate: now.slice(0, 10), projectId: 'p-1', lifeAreaId: 'la-1', createdAt: now, updatedAt: now },
  { id: 't-2', title: 'Draft project case-study', status: 'done', priority: 'medium', projectId: 'p-2', lifeAreaId: 'la-2', completedAt: now, createdAt: now, updatedAt: now },
];

export const mockMilestones: Milestone[] = [
  { id: 'm-1', projectId: 'p-1', title: 'Complete 4-week baseline', status: 'in_progress', createdAt: now, updatedAt: now },
  { id: 'm-2', projectId: 'p-2', title: 'Publish refreshed portfolio', status: 'open', createdAt: now, updatedAt: now },
];

export const mockHistoryEntries: ProjectHistoryEntry[] = [
  { id: 'h-1', projectId: 'p-2', type: 'paused', date: now, description: 'Project paused for scope review.', createdAt: now, updatedAt: now },
];
