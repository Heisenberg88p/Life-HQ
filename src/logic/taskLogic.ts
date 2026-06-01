import type { Task } from '../models/task';
import { getTodayDateString, isBeforeToday, isSameDay, isWithinCurrentWeek } from './dateLogic';

export function isTaskDone(task: Task): boolean {
  return task.status === 'done';
}

export function isTaskOpen(task: Task): boolean {
  return !isTaskDone(task);
}

export function isTaskOverdue(task: Task): boolean {
  return Boolean(task.dueDate && isBeforeToday(task.dueDate) && !isTaskDone(task));
}

export function getTasksForToday(tasks: Task[]): Task[] {
  const today = getTodayDateString();
  return tasks.filter((task) => isSameDay(task.plannedDate, today));
}

export function getTasksForCurrentWeek(tasks: Task[]): Task[] {
  return tasks.filter((task) => isWithinCurrentWeek(task.plannedDate));
}

export function getOverdueTasks(tasks: Task[]): Task[] {
  return tasks.filter(isTaskOverdue);
}

export function getOpenTasks(tasks: Task[]): Task[] {
  return tasks.filter(isTaskOpen);
}

export function getDoneTasks(tasks: Task[]): Task[] {
  return tasks.filter(isTaskDone);
}

export function getTasksByProjectId(tasks: Task[], projectId: string): Task[] {
  return tasks.filter((task) => task.projectId === projectId);
}

export function getTasksByLifeAreaId(tasks: Task[], lifeAreaId: string): Task[] {
  return tasks.filter((task) => task.lifeAreaId === lifeAreaId);
}
