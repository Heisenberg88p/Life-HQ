import { isProjectActive, isProjectPaused } from '../../logic/projectLogic';
import type { LifeHQState } from '../useLifeHQStore';

export const selectProjects = (state: LifeHQState) => state.projects;
export const selectProjectById = (projectId: string) => (state: LifeHQState) => state.projects.find((p) => p.id === projectId);
export const selectProjectsByLifeAreaId = (lifeAreaId: string) => (state: LifeHQState) => state.projects.filter((p) => p.lifeAreaId === lifeAreaId);
export const selectActiveProjects = (state: LifeHQState) => state.projects.filter(isProjectActive);
export const selectPausedProjects = (state: LifeHQState) => state.projects.filter(isProjectPaused);
