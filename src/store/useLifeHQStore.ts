import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import { mockHistoryEntries, mockLifeAreas, mockMilestones, mockProjects, mockTasks } from '../data/mockData';
import { getTodayDateString, getTomorrowDateString, normalizeDate } from '../logic/dateLogic';
import type { Priority, ProjectStatus, TrafficLightStatus, TaskStatus, MilestoneStatus } from '../models/common';
import type { LifeArea } from '../models/lifeArea';
import type { Milestone } from '../models/milestone';
import type { Project } from '../models/project';
import type { ProjectHistoryEntry } from '../models/projectHistory';
import type { Task } from '../models/task';
import { createProjectHistoryEntry } from './helpers/historyHelpers';
import {
  createLifeHQStorage,
  getPersistedLifeHQState,
  LIFEHQ_STORAGE_KEY,
  LIFEHQ_STORAGE_VERSION,
  mergePersistedLifeHQState,
  sanitizePersistedLifeHQState,
} from './persistence';
import type { HistorySlice } from './slices/historySlice';
import type { LifeAreaSlice } from './slices/lifeAreaSlice';
import type { MilestoneSlice } from './slices/milestoneSlice';
import type { PauseProjectInput, ProjectSlice, ReactivateProjectInput } from './slices/projectSlice';
import type { TaskSlice } from './slices/taskSlice';
import type { UISlice } from './slices/uiSlice';

interface AppDataSlice {
  resetAppData: () => void;
  clearAllUserData: () => void;
}

type LifeHQState = LifeAreaSlice & ProjectSlice & TaskSlice & MilestoneSlice & HistorySlice & UISlice & AppDataSlice;

const now = () => new Date().toISOString();
const getInitialLifeHQData = () => ({
  lifeAreas: mockLifeAreas,
  projects: mockProjects,
  tasks: mockTasks,
  milestones: mockMilestones,
  historyEntries: mockHistoryEntries,
  uiState: { activeMainView: 'hq' as const, selectedProjectId: undefined },
});
const withUpdatedAt = <T extends { updatedAt: string }>(item: T) => ({ ...item, updatedAt: now() });

function getPauseProjectInput(input?: PauseProjectInput | string, note?: string): PauseProjectInput {
  if (typeof input === 'string') {
    return { reason: input, note };
  }

  return input ?? {};
}

function getReactivateProjectInput(input?: ReactivateProjectInput | string): ReactivateProjectInput {
  if (typeof input === 'string') {
    return { note: input };
  }

  return input ?? {};
}


const getHistoryValue = (value: string | undefined) => value ?? 'none';

const hasProjectPatchValue = <K extends keyof Project>(patch: Partial<Project>, key: K): patch is Partial<Project> & Pick<Project, K> =>
  Object.prototype.hasOwnProperty.call(patch, key);

function getProjectUpdateHistoryEntries(project: Project, patch: Partial<Project>, timestamp: string): ProjectHistoryEntry[] {
  const entries: ProjectHistoryEntry[] = [];

  if (hasProjectPatchValue(patch, 'status') && patch.status !== project.status) {
    entries.push(createProjectHistoryEntry({
      projectId: project.id,
      type: 'status_changed',
      oldValue: project.status,
      newValue: patch.status,
      description: `Status changed: ${project.status} → ${patch.status}.`,
      date: timestamp,
    }));
  }

  if (hasProjectPatchValue(patch, 'priority') && patch.priority !== project.priority) {
    entries.push(createProjectHistoryEntry({
      projectId: project.id,
      type: 'priority_changed',
      oldValue: project.priority,
      newValue: patch.priority,
      description: `Priority changed: ${project.priority} → ${patch.priority}.`,
      date: timestamp,
    }));
  }

  if (hasProjectPatchValue(patch, 'trafficLightStatus') && patch.trafficLightStatus !== project.trafficLightStatus) {
    entries.push(createProjectHistoryEntry({
      projectId: project.id,
      type: 'traffic_light_changed',
      oldValue: project.trafficLightStatus,
      newValue: patch.trafficLightStatus,
      description: `Traffic light changed: ${project.trafficLightStatus} → ${patch.trafficLightStatus}.`,
      date: timestamp,
    }));
  }

  if (hasProjectPatchValue(patch, 'targetDate') && patch.targetDate !== project.targetDate) {
    entries.push(createProjectHistoryEntry({
      projectId: project.id,
      type: 'target_date_changed',
      oldValue: getHistoryValue(project.targetDate),
      newValue: getHistoryValue(patch.targetDate),
      description: `Target date changed: ${getHistoryValue(project.targetDate)} → ${getHistoryValue(patch.targetDate)}.`,
      date: timestamp,
    }));
  }

  return entries;
}

const createLifeHQStoreState: StateCreator<LifeHQState, [], []> = (set) => ({
  ...getInitialLifeHQData(),

  addLifeArea: (lifeArea: LifeArea) => set((state) => ({ lifeAreas: [...state.lifeAreas, lifeArea] })),
  updateLifeArea: (id: string, patch: Partial<LifeArea>) =>
    set((state) => ({ lifeAreas: state.lifeAreas.map((item) => (item.id === id ? withUpdatedAt({ ...item, ...patch }) : item)) })),
  deleteLifeArea: (id: string) => set((state) => ({ lifeAreas: state.lifeAreas.filter((item) => item.id !== id) })),

  addProject: (project: Project) => set((state) => ({
    projects: [...state.projects, project],
    historyEntries: [
      ...state.historyEntries,
      createProjectHistoryEntry({
        projectId: project.id,
        type: 'created',
        description: `Projekt erstellt: ${project.name}.`,
        date: project.createdAt,
      }),
    ],
  })),
  updateProject: (id: string, patch: Partial<Project>) =>
    set((state) => {
      const project = state.projects.find((item) => item.id === id);

      if (!project) {
        return {};
      }

      const timestamp = now();
      const historyEntries = getProjectUpdateHistoryEntries(project, patch, timestamp);

      return {
        projects: state.projects.map((item) => (item.id === id ? { ...item, ...patch, updatedAt: timestamp } : item)),
        ...(historyEntries.length > 0 ? { historyEntries: [...state.historyEntries, ...historyEntries] } : {}),
      };
    }),
  deleteProject: (id: string) => set((state) => ({
    projects: state.projects.filter((item) => item.id !== id),
    tasks: state.tasks.filter((item) => item.projectId !== id),
    milestones: state.milestones.filter((item) => item.projectId !== id),
    historyEntries: state.historyEntries.filter((item) => item.projectId !== id),
  })),
  pauseProject: (id: string, input?: PauseProjectInput | string, note?: string) =>
    set((state) => {
      const project = state.projects.find((item) => item.id === id);

      if (!project || project.status === 'paused' || project.status === 'completed') {
        return {};
      }

      const pauseInput = getPauseProjectInput(input, note);
      const timestamp = now();
      const description = pauseInput.reason ? `Project paused: ${pauseInput.reason}` : 'Project paused.';

      return {
        projects: state.projects.map((item) => (item.id === id ? {
          ...item,
          status: 'paused',
          pausedAt: timestamp,
          pauseReason: pauseInput.reason,
          pauseNote: pauseInput.note,
          reviewDate: pauseInput.reviewDate,
          updatedAt: timestamp,
        } : item)),
        historyEntries: [
          ...state.historyEntries,
          createProjectHistoryEntry({
            projectId: id,
            type: 'paused',
            description,
            oldValue: project.status,
            newValue: 'paused',
            note: pauseInput.note ?? pauseInput.reason,
            date: timestamp,
          }),
        ],
      };
    }),
  reactivateProject: (id: string, input?: ReactivateProjectInput | string) =>
    set((state) => {
      const project = state.projects.find((item) => item.id === id);

      if (!project || project.status !== 'paused') {
        return {};
      }

      const reactivationInput = getReactivateProjectInput(input);
      const nextStatus = reactivationInput.status === 'planned' ? 'planned' : 'active';
      const timestamp = now();
      const description = reactivationInput.note ? `Project reactivated: ${reactivationInput.note}` : 'Project reactivated.';

      return {
        projects: state.projects.map((item) => (item.id === id ? {
          ...item,
          status: nextStatus,
          ...(reactivationInput.priority !== undefined ? { priority: reactivationInput.priority } : {}),
          ...(reactivationInput.trafficLightStatus !== undefined ? { trafficLightStatus: reactivationInput.trafficLightStatus } : {}),
          ...(reactivationInput.targetDate !== undefined ? { targetDate: reactivationInput.targetDate } : {}),
          ...(reactivationInput.description !== undefined ? { description: reactivationInput.description } : {}),
          reactivatedAt: timestamp,
          reactivationNote: reactivationInput.note,
          updatedAt: timestamp,
        } : item)),
        historyEntries: [
          ...state.historyEntries,
          createProjectHistoryEntry({
            projectId: id,
            type: 'reactivated',
            description,
            oldValue: 'paused',
            newValue: nextStatus,
            note: reactivationInput.note,
            date: timestamp,
          }),
        ],
      };
    }),
  updateProjectStatus: (id: string, status: ProjectStatus) =>
    set((state) => {
      const project = state.projects.find((item) => item.id === id);

      if (!project || project.status === status) {
        return {};
      }

      const timestamp = now();

      return {
        projects: state.projects.map((item) => (item.id === id ? {
          ...item,
          status,
          updatedAt: timestamp,
        } : item)),
        historyEntries: [
          ...state.historyEntries,
          createProjectHistoryEntry({
            projectId: id,
            type: 'status_changed',
            oldValue: project.status,
            newValue: status,
            description: `Status changed: ${project.status} → ${status}.`,
            date: timestamp,
          }),
        ],
      };
    }),
  updateProjectPriority: (id: string, priority: Priority) =>
    set((state) => {
      const project = state.projects.find((item) => item.id === id);

      if (!project || project.priority === priority) {
        return {};
      }

      const timestamp = now();

      return {
        projects: state.projects.map((item) => (item.id === id ? {
          ...item,
          priority,
          updatedAt: timestamp,
        } : item)),
        historyEntries: [
          ...state.historyEntries,
          createProjectHistoryEntry({
            projectId: id,
            type: 'priority_changed',
            oldValue: project.priority,
            newValue: priority,
            description: `Priority changed: ${project.priority} → ${priority}.`,
            date: timestamp,
          }),
        ],
      };
    }),
  updateProjectTrafficLightStatus: (id: string, trafficLightStatus: TrafficLightStatus) =>
    set((state) => {
      const project = state.projects.find((item) => item.id === id);

      if (!project || project.trafficLightStatus === trafficLightStatus) {
        return {};
      }

      const timestamp = now();

      return {
        projects: state.projects.map((item) => (item.id === id ? {
          ...item,
          trafficLightStatus,
          updatedAt: timestamp,
        } : item)),
        historyEntries: [
          ...state.historyEntries,
          createProjectHistoryEntry({
            projectId: id,
            type: 'traffic_light_changed',
            oldValue: project.trafficLightStatus,
            newValue: trafficLightStatus,
            description: `Traffic light changed: ${project.trafficLightStatus} → ${trafficLightStatus}.`,
            date: timestamp,
          }),
        ],
      };
    }),

  addTask: (task: Task) => set((state) => ({
    tasks: [...state.tasks, task],
    ...(task.projectId ? {
      historyEntries: [
        ...state.historyEntries,
        createProjectHistoryEntry({
          projectId: task.projectId,
          type: 'task_created',
          taskId: task.id,
          description: `Task created: ${task.title}.`,
          date: task.createdAt,
        }),
      ],
    } : {}),
  })),
  updateTask: (id: string, patch: Partial<Task>) =>
    set((state) => ({ tasks: state.tasks.map((item) => (item.id === id ? withUpdatedAt({ ...item, ...patch }) : item)) })),
  deleteTask: (id: string) => set((state) => ({ tasks: state.tasks.filter((item) => item.id !== id) })),
  updateTaskStatus: (id: string, status: TaskStatus) =>
    set((state) => {
      const task = state.tasks.find((item) => item.id === id);

      if (!task || (task.status === 'done' && status === 'done')) {
        return {};
      }

      const timestamp = now();
      const taskProjectId = task.projectId;
      const shouldCreateHistoryEntry = Boolean(taskProjectId && task.status !== 'done' && status === 'done');

      return {
        tasks: state.tasks.map((item) => {
          if (item.id !== id) {
            return item;
          }

          return {
            ...item,
            status,
            completedAt: status === 'done' ? timestamp : undefined,
            updatedAt: timestamp,
          };
        }),
        ...(shouldCreateHistoryEntry ? {
          historyEntries: [
            ...state.historyEntries,
            createProjectHistoryEntry({
              projectId: taskProjectId as string,
              type: 'task_completed',
              taskId: task.id,
              oldValue: task.status,
              newValue: 'done',
              description: `Task completed: ${task.title}.`,
              date: timestamp,
            }),
          ],
        } : {}),
      };
    }),
  updateTaskPriority: (id: string, priority: Priority) =>
    set((state) => ({ tasks: state.tasks.map((item) => (item.id === id ? withUpdatedAt({ ...item, priority }) : item)) })),
  completeTask: (id: string) =>
    set((state) => {
      const task = state.tasks.find((item) => item.id === id);

      if (!task || task.status === 'done') {
        return {};
      }

      const timestamp = now();

      return {
        tasks: state.tasks.map((item) => (item.id === id ? {
          ...item,
          status: 'done',
          completedAt: timestamp,
          updatedAt: timestamp,
        } : item)),
        ...(task.projectId ? {
          historyEntries: [
            ...state.historyEntries,
            createProjectHistoryEntry({
              projectId: task.projectId,
              type: 'task_completed',
              taskId: task.id,
              oldValue: task.status,
              newValue: 'done',
              description: `Task completed: ${task.title}.`,
              date: timestamp,
            }),
          ],
        } : {}),
      };
    }),
  setTaskPlannedDate: (id: string, plannedDate: string | Date) =>
    set((state) => ({ tasks: state.tasks.map((item) => (item.id === id ? withUpdatedAt({ ...item, plannedDate: normalizeDate(plannedDate) }) : item)) })),
  scheduleTaskForToday: (id: string) =>
    set((state) => ({ tasks: state.tasks.map((item) => (item.id === id ? withUpdatedAt({ ...item, plannedDate: getTodayDateString() }) : item)) })),
  scheduleTaskForTomorrow: (id: string) =>
    set((state) => ({ tasks: state.tasks.map((item) => (item.id === id ? withUpdatedAt({ ...item, plannedDate: getTomorrowDateString() }) : item)) })),
  clearTaskPlannedDate: (id: string) =>
    set((state) => ({ tasks: state.tasks.map((item) => (item.id === id ? withUpdatedAt({ ...item, plannedDate: undefined }) : item)) })),
  setTaskDueDate: (id: string, dueDate: string | Date) =>
    set((state) => ({ tasks: state.tasks.map((item) => (item.id === id ? withUpdatedAt({ ...item, dueDate: normalizeDate(dueDate) }) : item)) })),
  clearTaskDueDate: (id: string) =>
    set((state) => ({ tasks: state.tasks.map((item) => (item.id === id ? withUpdatedAt({ ...item, dueDate: undefined }) : item)) })),
  updateTaskDates: (id: string, dates: { plannedDate?: string | Date; dueDate?: string | Date }) =>
    set((state) => ({
      tasks: state.tasks.map((item) => (item.id === id ? withUpdatedAt({
        ...item,
        plannedDate: dates.plannedDate === undefined ? item.plannedDate : normalizeDate(dates.plannedDate),
        dueDate: dates.dueDate === undefined ? item.dueDate : normalizeDate(dates.dueDate),
      }) : item)),
    })),

  addMilestone: (milestone: Milestone) => set((state) => ({
    milestones: [...state.milestones, milestone],
    historyEntries: [
      ...state.historyEntries,
      createProjectHistoryEntry({
        projectId: milestone.projectId,
        type: 'milestone_created',
        milestoneId: milestone.id,
        description: `Milestone created: ${milestone.title}.`,
        date: milestone.createdAt,
      }),
    ],
  })),
  updateMilestone: (id: string, patch: Partial<Milestone>) =>
    set((state) => {
      const milestone = state.milestones.find((item) => item.id === id);

      if (!milestone) {
        return {};
      }

      const hasChanged = Object.entries(patch).some(([key, value]) => milestone[key as keyof Milestone] !== value);

      if (!hasChanged) {
        return {};
      }

      const timestamp = now();

      return {
        milestones: state.milestones.map((item) => (item.id === id ? { ...item, ...patch, updatedAt: timestamp } : item)),
        historyEntries: [
          ...state.historyEntries,
          createProjectHistoryEntry({
            projectId: milestone.projectId,
            type: 'milestone_updated',
            milestoneId: milestone.id,
            description: `Milestone updated: ${patch.title ?? milestone.title}.`,
            date: timestamp,
          }),
        ],
      };
    }),
  deleteMilestone: (id: string) => set((state) => ({ milestones: state.milestones.filter((item) => item.id !== id) })),
  updateMilestoneStatus: (id: string, status: MilestoneStatus) =>
    set((state) => {
      const milestone = state.milestones.find((item) => item.id === id);

      if (!milestone || (milestone.status === 'done' && status === 'done')) {
        return {};
      }

      const timestamp = now();
      const shouldCreateHistoryEntry = milestone.status !== 'done' && status === 'done';

      return {
        milestones: state.milestones.map((item) => (item.id === id ? {
          ...item,
          status,
          completedAt: status === 'done' ? timestamp : undefined,
          updatedAt: timestamp,
        } : item)),
        ...(shouldCreateHistoryEntry ? {
          historyEntries: [
            ...state.historyEntries,
            createProjectHistoryEntry({
              projectId: milestone.projectId,
              type: 'milestone_completed',
              milestoneId: milestone.id,
              oldValue: milestone.status,
              newValue: 'done',
              description: `Milestone completed: ${milestone.title}.`,
              date: timestamp,
            }),
          ],
        } : {}),
      };
    }),
  completeMilestone: (id: string) =>
    set((state) => {
      const milestone = state.milestones.find((item) => item.id === id);

      if (!milestone || milestone.status === 'done') {
        return {};
      }

      const timestamp = now();

      return {
        milestones: state.milestones.map((item) => (item.id === id ? {
          ...item,
          status: 'done',
          completedAt: timestamp,
          updatedAt: timestamp,
        } : item)),
        historyEntries: [
          ...state.historyEntries,
          createProjectHistoryEntry({
            projectId: milestone.projectId,
            type: 'milestone_completed',
            milestoneId: milestone.id,
            oldValue: milestone.status,
            newValue: 'done',
            description: `Milestone completed: ${milestone.title}.`,
            date: timestamp,
          }),
        ],
      };
    }),

  addHistoryEntry: (entry: ProjectHistoryEntry) => set((state) => ({ historyEntries: [...state.historyEntries, entry] })),

  setActiveMainView: (view) => set((state) => ({ uiState: { ...state.uiState, activeMainView: view } })),
  setSelectedProject: (projectId: string) => set((state) => ({ uiState: { ...state.uiState, selectedProjectId: projectId } })),
  clearSelectedProject: () => set((state) => ({ uiState: { ...state.uiState, selectedProjectId: undefined } })),

  resetAppData: () => set(getInitialLifeHQData()),
  clearAllUserData: () => set((state) => ({
    lifeAreas: [],
    projects: [],
    tasks: [],
    milestones: [],
    historyEntries: [],
    uiState: { ...state.uiState, selectedProjectId: undefined },
  })),
});

export const useLifeHQStore = create<LifeHQState>()(
  persist<LifeHQState, [], [], ReturnType<typeof getPersistedLifeHQState>>(createLifeHQStoreState, {
    name: LIFEHQ_STORAGE_KEY,
    version: LIFEHQ_STORAGE_VERSION,
    storage: createLifeHQStorage(),
    partialize: getPersistedLifeHQState,
    migrate: (persistedState) => sanitizePersistedLifeHQState(persistedState, getInitialLifeHQData()),
    merge: mergePersistedLifeHQState,
    onRehydrateStorage: () => (_state, error) => {
      if (error) {
        console.warn('LifeHQ storage could not be restored. Falling back to initial app data.', error);
      }
    },
  }),
);

export type { LifeHQState };
