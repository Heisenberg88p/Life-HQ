import { isTaskDone, isTaskOpen } from '../../logic/taskLogic';
import type { LifeHQState } from '../useLifeHQStore';

export const selectTasks = (state: LifeHQState) => state.tasks;
export const selectTasksByProjectId = (projectId: string) => (state: LifeHQState) => state.tasks.filter((t) => t.projectId === projectId);
export const selectTasksByLifeAreaId = (lifeAreaId: string) => (state: LifeHQState) => state.tasks.filter((t) => t.lifeAreaId === lifeAreaId);
export const selectOpenTasks = (state: LifeHQState) => state.tasks.filter(isTaskOpen);
export const selectCompletedTasks = (state: LifeHQState) => state.tasks.filter(isTaskDone);
