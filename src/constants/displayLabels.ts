import type { MilestoneStatus, Priority, ProjectStatus, TaskStatus, TrafficLightStatus } from '../models/common';

export const projectStatusLabels: Record<ProjectStatus, string> = {
  planned: 'Geplant',
  active: 'Aktiv',
  paused: 'Pausiert',
  completed: 'Abgeschlossen',
};

export const taskStatusLabels: Record<TaskStatus, string> = {
  open: 'Offen',
  in_progress: 'In Arbeit',
  done: 'Erledigt',
};

export const milestoneStatusLabels: Record<MilestoneStatus, string> = taskStatusLabels;

export const priorityLabels: Record<Priority, string> = {
  low: 'Niedrig',
  medium: 'Mittel',
  high: 'Hoch',
  critical: 'Kritisch',
};

export const trafficLightLabels: Record<TrafficLightStatus, string> = {
  green: 'Grün',
  yellow: 'Gelb',
  red: 'Rot',
};

export const projectStatusOptions: ProjectStatus[] = ['planned', 'active', 'paused', 'completed'];
export const taskStatusOptions: TaskStatus[] = ['open', 'in_progress', 'done'];
export const milestoneStatusOptions: MilestoneStatus[] = taskStatusOptions;
export const priorityOptions: Priority[] = ['low', 'medium', 'high', 'critical'];
export const trafficLightOptions: TrafficLightStatus[] = ['green', 'yellow', 'red'];
