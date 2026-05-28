import { create } from 'zustand';
import { mockHistoryEntries, mockLifeAreas, mockMilestones, mockProjects, mockTasks } from '../data/mockData';
import type { Priority, ProjectStatus, TrafficLightStatus, TaskStatus, MilestoneStatus } from '../models/common';
import type { LifeArea } from '../models/lifeArea';
import type { Milestone } from '../models/milestone';
import type { Project } from '../models/project';
import type { ProjectHistoryEntry } from '../models/projectHistory';
import type { Task } from '../models/task';
import type { HistorySlice } from './slices/historySlice';
import type { LifeAreaSlice } from './slices/lifeAreaSlice';
import type { MilestoneSlice } from './slices/milestoneSlice';
import type { ProjectSlice } from './slices/projectSlice';
import type { TaskSlice } from './slices/taskSlice';
import type { UISlice } from './slices/uiSlice';

type LifeHQState = LifeAreaSlice & ProjectSlice & TaskSlice & MilestoneSlice & HistorySlice & UISlice;

const now = () => new Date().toISOString();
const withUpdatedAt = <T extends { updatedAt: string }>(item: T) => ({ ...item, updatedAt: now() });

export const useLifeHQStore = create<LifeHQState>((set) => ({
  lifeAreas: mockLifeAreas,
  projects: mockProjects,
  tasks: mockTasks,
  milestones: mockMilestones,
  historyEntries: mockHistoryEntries,
  uiState: { activeMainView: 'hq', selectedProjectId: undefined },

  addLifeArea: (lifeArea: LifeArea) => set((state) => ({ lifeAreas: [...state.lifeAreas, lifeArea] })),
  updateLifeArea: (id: string, patch: Partial<LifeArea>) =>
    set((state) => ({ lifeAreas: state.lifeAreas.map((item) => (item.id === id ? withUpdatedAt({ ...item, ...patch }) : item)) })),
  deleteLifeArea: (id: string) => set((state) => ({ lifeAreas: state.lifeAreas.filter((item) => item.id !== id) })),

  addProject: (project: Project) => set((state) => ({ projects: [...state.projects, project] })),
  updateProject: (id: string, patch: Partial<Project>) =>
    set((state) => ({ projects: state.projects.map((item) => (item.id === id ? withUpdatedAt({ ...item, ...patch }) : item)) })),
  deleteProject: (id: string) => set((state) => ({ projects: state.projects.filter((item) => item.id !== id) })),
  pauseProject: (id: string, reason?: string, note?: string) =>
    set((state) => ({
      projects: state.projects.map((item) => (item.id === id ? withUpdatedAt({ ...item, status: 'paused', pausedAt: now(), pauseReason: reason, pauseNote: note }) : item)),
      historyEntries: [...state.historyEntries, { id: `h-${Date.now()}`, projectId: id, type: 'paused', date: now(), description: 'Project paused.', note, createdAt: now(), updatedAt: now() }],
    })),
  reactivateProject: (id: string, note?: string) =>
    set((state) => ({
      projects: state.projects.map((item) => (item.id === id ? withUpdatedAt({ ...item, status: 'active', reactivatedAt: now(), reactivationNote: note }) : item)),
      historyEntries: [...state.historyEntries, { id: `h-${Date.now()}`, projectId: id, type: 'reactivated', date: now(), description: 'Project reactivated.', note, createdAt: now(), updatedAt: now() }],
    })),
  updateProjectStatus: (id: string, status: ProjectStatus) =>
    set((state) => ({ projects: state.projects.map((item) => (item.id === id ? withUpdatedAt({ ...item, status }) : item)) })),
  updateProjectPriority: (id: string, priority: Priority) =>
    set((state) => ({ projects: state.projects.map((item) => (item.id === id ? withUpdatedAt({ ...item, priority }) : item)) })),
  updateProjectTrafficLightStatus: (id: string, trafficLightStatus: TrafficLightStatus) =>
    set((state) => ({ projects: state.projects.map((item) => (item.id === id ? withUpdatedAt({ ...item, trafficLightStatus }) : item)) })),

  addTask: (task: Task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTask: (id: string, patch: Partial<Task>) =>
    set((state) => ({ tasks: state.tasks.map((item) => (item.id === id ? withUpdatedAt({ ...item, ...patch }) : item)) })),
  deleteTask: (id: string) => set((state) => ({ tasks: state.tasks.filter((item) => item.id !== id) })),
  updateTaskStatus: (id: string, status: TaskStatus) =>
    set((state) => ({ tasks: state.tasks.map((item) => (item.id === id ? withUpdatedAt({ ...item, status }) : item)) })),
  updateTaskPriority: (id: string, priority: Priority) =>
    set((state) => ({ tasks: state.tasks.map((item) => (item.id === id ? withUpdatedAt({ ...item, priority }) : item)) })),
  completeTask: (id: string) =>
    set((state) => ({ tasks: state.tasks.map((item) => (item.id === id ? withUpdatedAt({ ...item, status: 'done', completedAt: now() }) : item)) })),

  addMilestone: (milestone: Milestone) => set((state) => ({ milestones: [...state.milestones, milestone] })),
  updateMilestone: (id: string, patch: Partial<Milestone>) =>
    set((state) => ({ milestones: state.milestones.map((item) => (item.id === id ? withUpdatedAt({ ...item, ...patch }) : item)) })),
  deleteMilestone: (id: string) => set((state) => ({ milestones: state.milestones.filter((item) => item.id !== id) })),
  updateMilestoneStatus: (id: string, status: MilestoneStatus) =>
    set((state) => ({ milestones: state.milestones.map((item) => (item.id === id ? withUpdatedAt({ ...item, status }) : item)) })),
  completeMilestone: (id: string) =>
    set((state) => ({ milestones: state.milestones.map((item) => (item.id === id ? withUpdatedAt({ ...item, status: 'done', completedAt: now() }) : item)) })),

  addHistoryEntry: (entry: ProjectHistoryEntry) => set((state) => ({ historyEntries: [...state.historyEntries, entry] })),

  setActiveMainView: (view) => set((state) => ({ uiState: { ...state.uiState, activeMainView: view } })),
  setSelectedProject: (projectId: string) => set((state) => ({ uiState: { ...state.uiState, selectedProjectId: projectId } })),
  clearSelectedProject: () => set((state) => ({ uiState: { ...state.uiState, selectedProjectId: undefined } })),
}));

export type { LifeHQState };
