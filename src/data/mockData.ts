import type { LifeArea } from '../models/lifeArea';
import type { Milestone } from '../models/milestone';
import type { Project } from '../models/project';
import type { ProjectHistoryEntry } from '../models/projectHistory';
import type { Task } from '../models/task';

const now = new Date().toISOString();

export const mockLifeAreas: LifeArea[] = [
  { id: 'la-1', name: 'Health', description: 'Physical and mental resilience', status: 'green', priority: 'high', createdAt: now, updatedAt: now },
  { id: 'la-2', name: 'Career', description: 'Professional growth and impact', status: 'yellow', priority: 'critical', createdAt: now, updatedAt: now },
  { id: 'la-3', name: 'Finance', description: 'Calm capital allocation and long-term optionality', status: 'green', priority: 'medium', createdAt: now, updatedAt: now },
];

export const mockProjects: Project[] = [
  {
    id: 'p-1',
    name: 'Fitness Routine',
    description: 'Build a stable weekly baseline for strength, mobility, and recovery.',
    lifeAreaId: 'la-1',
    status: 'active',
    priority: 'high',
    trafficLightStatus: 'green',
    targetDate: '2026-07-15',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'p-2',
    name: 'Portfolio Refresh',
    description: 'Refine the public professional presence before restarting execution.',
    lifeAreaId: 'la-2',
    status: 'paused',
    priority: 'critical',
    trafficLightStatus: 'red',
    targetDate: '2026-08-30',
    pausedAt: now,
    pauseReason: 'Scope reset',
    pauseNote: 'Waiting for a clearer positioning decision before continuing.',
    reviewDate: '2026-06-20',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'p-3',
    name: 'Investment Policy Draft',
    description: 'Define calm rules for recurring allocation decisions.',
    lifeAreaId: 'la-3',
    status: 'planned',
    priority: 'medium',
    trafficLightStatus: 'yellow',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'p-4',
    name: 'Annual Health Check',
    description: 'Close the baseline health review and keep the result available for future planning.',
    lifeAreaId: 'la-1',
    status: 'completed',
    priority: 'low',
    trafficLightStatus: 'green',
    targetDate: '2026-05-10',
    completedAt: now,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'p-5',
    name: 'Career Positioning Reset',
    description: 'Clarify the next strategic career direction without turning it into a task list.',
    lifeAreaId: 'la-2',
    status: 'active',
    priority: 'critical',
    trafficLightStatus: 'yellow',
    targetDate: '2026-09-15',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'p-6',
    name: 'Lebensplan 2026',
    description: 'Übergeordnete Planung und Ausrichtung.',
    status: 'planned',
    priority: 'medium',
    trafficLightStatus: 'yellow',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'p-7',
    name: 'Ideen sammeln',
    description: 'Neue Ideen und Möglichkeiten.',
    status: 'planned',
    priority: 'low',
    trafficLightStatus: 'green',
    createdAt: now,
    updatedAt: now,
  },
];

export const mockTasks: Task[] = [
  { id: 't-1', title: 'Morning workout block', status: 'open', priority: 'high', plannedDate: now.slice(0, 10), projectId: 'p-1', lifeAreaId: 'la-1', createdAt: now, updatedAt: now },
  { id: 't-2', title: 'Draft project case-study', status: 'done', priority: 'medium', projectId: 'p-2', lifeAreaId: 'la-2', completedAt: now, createdAt: now, updatedAt: now },
  { id: 't-3', title: 'Schedule recovery window', status: 'in_progress', priority: 'medium', plannedDate: '2026-06-03', projectId: 'p-1', lifeAreaId: 'la-1', createdAt: now, updatedAt: now },
  { id: 't-4', title: 'Document portfolio positioning questions', status: 'open', priority: 'high', plannedDate: '2026-06-10', projectId: 'p-2', lifeAreaId: 'la-2', createdAt: now, updatedAt: now },
  { id: 't-5', title: 'Archive health check notes', status: 'done', priority: 'low', projectId: 'p-4', lifeAreaId: 'la-1', completedAt: now, createdAt: now, updatedAt: now },
  { id: 't-6', title: 'Review weekly nutrition baseline', status: 'open', priority: 'medium', plannedDate: '2026-06-02', lifeAreaId: 'la-1', createdAt: now, updatedAt: now },
  { id: 't-7', title: 'Send portfolio feedback request', status: 'open', priority: 'medium', dueDate: '2026-05-28', projectId: 'p-2', lifeAreaId: 'la-2', createdAt: now, updatedAt: now },
  { id: 't-8', title: 'Jahresziele strukturieren', status: 'open', priority: 'medium', projectId: 'p-6', createdAt: now, updatedAt: now },
  { id: 't-9', title: 'Prioritäten für Q3 festlegen', status: 'open', priority: 'medium', projectId: 'p-6', createdAt: now, updatedAt: now },
  { id: 't-10', title: 'Neue Projektideen notieren', status: 'open', priority: 'low', projectId: 'p-7', createdAt: now, updatedAt: now },
];

export const mockMilestones: Milestone[] = [
  { id: 'm-1', projectId: 'p-1', title: 'Complete 4-week baseline', status: 'in_progress', targetDate: '2026-06-30', createdAt: now, updatedAt: now },
  { id: 'm-2', projectId: 'p-2', title: 'Publish refreshed portfolio', status: 'open', targetDate: '2026-08-30', createdAt: now, updatedAt: now },
  { id: 'm-3', projectId: 'p-4', title: 'Health review completed', status: 'done', completedAt: now, createdAt: now, updatedAt: now },
];

export const mockHistoryEntries: ProjectHistoryEntry[] = [
  { id: 'h-1', projectId: 'p-2', type: 'paused', date: now, description: 'Project paused for scope review.', note: 'Revisit after positioning decision.', createdAt: now, updatedAt: now },
  { id: 'h-2', projectId: 'p-4', type: 'completed', date: now, description: 'Annual health check baseline completed.', createdAt: now, updatedAt: now },
];
