import type { Task } from '../models/task';
import {
  getTodayDateString,
  isAfterNextWeek,
  isNextWeek,
  isOverdue,
  isSameDay,
  isThisWeek,
} from './dateLogic';

export function isTaskDone(task: Task): boolean {
  return task.status === 'done';
}

export function isTaskOpen(task: Task): boolean {
  return !isTaskDone(task);
}

export function isTaskOverdue(task: Task): boolean {
  return isOverdue(task.dueDate, isTaskDone(task));
}

export function getTasksForToday(tasks: Task[]): Task[] {
  const today = getTodayDateString();
  return tasks.filter((task) => isSameDay(task.plannedDate, today));
}

export function getTasksForThisWeek(tasks: Task[]): Task[] {
  return tasks.filter((task) => isThisWeek(task.plannedDate));
}

export function getTasksForCurrentWeek(tasks: Task[]): Task[] {
  return getTasksForThisWeek(tasks);
}

export function getTasksForNextWeek(tasks: Task[]): Task[] {
  return tasks.filter((task) => isNextWeek(task.plannedDate));
}

export function getTasksForLater(tasks: Task[]): Task[] {
  return tasks.filter((task) => Boolean(task.plannedDate && isAfterNextWeek(task.plannedDate) && !isTaskDone(task)));
}

export function getOverdueTasks(tasks: Task[]): Task[] {
  return tasks.filter(isTaskOverdue);
}

export function getOpenTasks(tasks: Task[]): Task[] {
  return tasks.filter(isTaskOpen);
}

export function getCompletedTasks(tasks: Task[]): Task[] {
  return tasks.filter(isTaskDone);
}

export function getDoneTasks(tasks: Task[]): Task[] {
  return getCompletedTasks(tasks);
}

export function getTasksWithoutPlannedDate(tasks: Task[]): Task[] {
  return tasks.filter((task) => !task.plannedDate);
}

export function getTasksByProjectId(tasks: Task[], projectId: string): Task[] {
  return tasks.filter((task) => task.projectId === projectId);
}

export function getTasksByLifeAreaId(tasks: Task[], lifeAreaId: string): Task[] {
  return tasks.filter((task) => task.lifeAreaId === lifeAreaId);
}
