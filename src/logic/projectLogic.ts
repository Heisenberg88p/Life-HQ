import type { Project } from '../models/project';
import { isBeforeToday } from './dateLogic';

export function isProjectPaused(project: Project): boolean {
  return project.status === 'paused';
}

export function isProjectActive(project: Project): boolean {
  return project.status === 'active';
}

export function isProjectCompleted(project: Project): boolean {
  return project.status === 'completed';
}

export function isProjectPlanned(project: Project): boolean {
  return project.status === 'planned';
}

export function isProjectOverdue(project: Project): boolean {
  return Boolean(project.targetDate && isBeforeToday(project.targetDate) && !isProjectCompleted(project));
}

export function getActiveProjects(projects: Project[]): Project[] {
  return projects.filter(isProjectActive);
}

export function getPausedProjects(projects: Project[]): Project[] {
  return projects.filter(isProjectPaused);
}

export function getCompletedProjects(projects: Project[]): Project[] {
  return projects.filter(isProjectCompleted);
}

export function getPlannedProjects(projects: Project[]): Project[] {
  return projects.filter(isProjectPlanned);
}

export function getProjectsByLifeAreaId(projects: Project[], lifeAreaId: string): Project[] {
  return projects.filter((project) => project.lifeAreaId === lifeAreaId);
}

export function getCriticalProjects(projects: Project[]): Project[] {
  return projects.filter((project) => project.priority === 'critical' || project.trafficLightStatus === 'red');
}
