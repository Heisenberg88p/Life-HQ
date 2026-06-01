import {
  getCompletedTasks,
  getOpenTasks,
  getOverdueTasks,
  getTasksForLater,
  getTasksForNextWeek,
  getTasksForThisWeek,
  getTasksForToday,
  getTasksWithoutPlannedDate,
} from '../../logic/taskLogic';
import type { LifeHQState } from '../useLifeHQStore';

export const selectTasks = (state: LifeHQState) => state.tasks;
export const selectTasksByProjectId = (projectId: string) => (state: LifeHQState) => state.tasks.filter((t) => t.projectId === projectId);
export const selectTasksByLifeAreaId = (lifeAreaId: string) => (state: LifeHQState) => state.tasks.filter((t) => t.lifeAreaId === lifeAreaId);
export const selectTasksForToday = (state: LifeHQState) => getTasksForToday(state.tasks);
export const selectTasksForThisWeek = (state: LifeHQState) => getTasksForThisWeek(state.tasks);
export const selectTasksForNextWeek = (state: LifeHQState) => getTasksForNextWeek(state.tasks);
export const selectTasksForLater = (state: LifeHQState) => getTasksForLater(state.tasks);
export const selectOverdueTasks = (state: LifeHQState) => getOverdueTasks(state.tasks);
export const selectOpenTasks = (state: LifeHQState) => getOpenTasks(state.tasks);
export const selectCompletedTasks = (state: LifeHQState) => getCompletedTasks(state.tasks);
export const selectTasksWithoutPlannedDate = (state: LifeHQState) => getTasksWithoutPlannedDate(state.tasks);
