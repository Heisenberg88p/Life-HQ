import { isProjectActive, isProjectCompleted, isProjectPaused, isProjectPlanned } from '../../logic/projectLogic';
import type { LifeHQState } from '../useLifeHQStore';

export const selectProjects = (state: LifeHQState) => state.projects;
export const selectProjectById = (projectId: string) => (state: LifeHQState) => state.projects.find((p) => p.id === projectId);
export const selectProjectsByLifeAreaId = (lifeAreaId: string) => (state: LifeHQState) => state.projects.filter((p) => p.lifeAreaId === lifeAreaId);
export const selectActiveProjects = (state: LifeHQState) => state.projects.filter(isProjectActive);
export const selectPausedProjects = (state: LifeHQState) => state.projects.filter(isProjectPaused);
export const selectPlannedProjects = (state: LifeHQState) => state.projects.filter(isProjectPlanned);
export const selectCompletedProjects = (state: LifeHQState) => state.projects.filter(isProjectCompleted);
export const selectCriticalProjects = (state: LifeHQState) =>
  state.projects.filter((project) => project.priority === 'critical' || project.trafficLightStatus === 'red');
export const selectRedTrafficLightProjects = (state: LifeHQState) => state.projects.filter((project) => project.trafficLightStatus === 'red');

export const getProjectsByLifeSystem = (lifeSystemId: string) => (state: LifeHQState) => state.projects.filter((project) => project.lifeSystemId === lifeSystemId);
export const getLifeSystemProjectCount = (lifeSystemId: string) => (state: LifeHQState) => getProjectsByLifeSystem(lifeSystemId)(state).length;
