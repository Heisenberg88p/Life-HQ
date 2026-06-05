import type { StorageValue, PersistStorage } from 'zustand/middleware';
import { isValidDateString, safeNormalizeDate } from '../logic/dateLogic';
import type { Priority, ProjectStatus, TrafficLightStatus, TaskStatus, MilestoneStatus } from '../models/common';
import type { LifeArea } from '../models/lifeArea';
import type { Milestone } from '../models/milestone';
import type { Project } from '../models/project';
import type { ProjectHistoryEntry, ProjectHistoryEntryType } from '../models/projectHistory';
import type { Task } from '../models/task';
import {
  MILESTONE_STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  PROJECT_STATUS_OPTIONS,
  TASK_STATUS_OPTIONS,
  TRAFFIC_LIGHT_STATUS_OPTIONS,
} from '../constants/statusOptions';

export const LIFEHQ_STORAGE_KEY = 'lifehq-v1-storage';
export const LIFEHQ_STORAGE_VERSION = 1;

export interface PersistableLifeHQState {
  lifeAreas: LifeArea[];
  projects: Project[];
  tasks: Task[];
  milestones: Milestone[];
  historyEntries: ProjectHistoryEntry[];
}

export interface LifeHQPersistedState extends PersistableLifeHQState {
  storageVersion: number;
}

const HISTORY_ENTRY_TYPE_OPTIONS: ProjectHistoryEntryType[] = [
  'created',
  'updated',
  'status_changed',
  'priority_changed',
  'traffic_light_changed',
  'target_date_changed',
  'paused',
  'reactivated',
  'completed',
  'task_created',
  'task_completed',
  'task_linked',
  'milestone_created',
  'milestone_completed',
  'milestone_updated',
  'note_added',
];

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const isString = (value: unknown): value is string => typeof value === 'string';
const getRequiredString = (value: unknown): string | undefined => {
  if (!isString(value)) {
    return undefined;
  }

  const trimmedValue = value.trim();

  return trimmedValue ? trimmedValue : undefined;
};
const getOptionalString = (value: unknown): string | undefined => (isString(value) ? getRequiredString(value) : undefined);

const isOneOf = <T extends string>(value: unknown, options: readonly T[]): value is T => isString(value) && options.includes(value as T);
const getEnumValue = <T extends string>(value: unknown, options: readonly T[], fallback: T): T => (isOneOf(value, options) ? value : fallback);
const getOptionalDateOnly = (value: unknown): string | undefined => (isString(value) ? safeNormalizeDate(value) : undefined);
const getOptionalTimestamp = (value: unknown): string | undefined => {
  if (!isString(value)) {
    return undefined;
  }

  if (isValidDateString(value)) {
    return value;
  }

  return Number.isNaN(new Date(value).getTime()) ? undefined : value;
};
const getRequiredTimestamp = (value: unknown, fallback: string): string => getOptionalTimestamp(value) ?? fallback;

const sanitizeLifeArea = (value: unknown, timestampFallback: string): LifeArea | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const id = getRequiredString(value.id);
  const name = getRequiredString(value.name);

  if (!id || !name) {
    return undefined;
  }

  return {
    id,
    name,
    description: getOptionalString(value.description),
    status: isOneOf(value.status, TRAFFIC_LIGHT_STATUS_OPTIONS) ? value.status : undefined,
    priority: isOneOf(value.priority, PRIORITY_OPTIONS) ? value.priority : undefined,
    createdAt: getRequiredTimestamp(value.createdAt, timestampFallback),
    updatedAt: getRequiredTimestamp(value.updatedAt, timestampFallback),
  };
};

const sanitizeProject = (value: unknown, timestampFallback: string): Project | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const id = getRequiredString(value.id);
  const name = getRequiredString(value.name);

  if (!id || !name) {
    return undefined;
  }

  return {
    id,
    name,
    description: getOptionalString(value.description),
    lifeAreaId: getOptionalString(value.lifeAreaId),
    status: getEnumValue<ProjectStatus>(value.status, PROJECT_STATUS_OPTIONS, 'planned'),
    priority: getEnumValue<Priority>(value.priority, PRIORITY_OPTIONS, 'medium'),
    trafficLightStatus: getEnumValue<TrafficLightStatus>(value.trafficLightStatus, TRAFFIC_LIGHT_STATUS_OPTIONS, 'green'),
    targetDate: getOptionalDateOnly(value.targetDate),
    completedAt: getOptionalTimestamp(value.completedAt),
    pausedAt: getOptionalTimestamp(value.pausedAt),
    pauseReason: getOptionalString(value.pauseReason),
    pauseNote: getOptionalString(value.pauseNote),
    reviewDate: getOptionalDateOnly(value.reviewDate),
    reactivatedAt: getOptionalTimestamp(value.reactivatedAt),
    reactivationNote: getOptionalString(value.reactivationNote),
    createdAt: getRequiredTimestamp(value.createdAt, timestampFallback),
    updatedAt: getRequiredTimestamp(value.updatedAt, timestampFallback),
  };
};

const sanitizeTask = (value: unknown, timestampFallback: string): Task | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const id = getRequiredString(value.id);
  const title = getRequiredString(value.title);

  if (!id || !title) {
    return undefined;
  }

  return {
    id,
    title,
    description: getOptionalString(value.description),
    status: getEnumValue<TaskStatus>(value.status, TASK_STATUS_OPTIONS, 'open'),
    priority: getEnumValue<Priority>(value.priority, PRIORITY_OPTIONS, 'medium'),
    dueDate: getOptionalDateOnly(value.dueDate),
    plannedDate: getOptionalDateOnly(value.plannedDate),
    completedAt: getOptionalTimestamp(value.completedAt),
    projectId: getOptionalString(value.projectId),
    lifeAreaId: getOptionalString(value.lifeAreaId),
    createdAt: getRequiredTimestamp(value.createdAt, timestampFallback),
    updatedAt: getRequiredTimestamp(value.updatedAt, timestampFallback),
  };
};

const sanitizeMilestone = (value: unknown, timestampFallback: string): Milestone | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const id = getRequiredString(value.id);
  const projectId = getRequiredString(value.projectId);
  const title = getRequiredString(value.title);

  if (!id || !projectId || !title) {
    return undefined;
  }

  return {
    id,
    projectId,
    title,
    description: getOptionalString(value.description),
    status: getEnumValue<MilestoneStatus>(value.status, MILESTONE_STATUS_OPTIONS, 'open'),
    targetDate: getOptionalDateOnly(value.targetDate),
    completedAt: getOptionalTimestamp(value.completedAt),
    createdAt: getRequiredTimestamp(value.createdAt, timestampFallback),
    updatedAt: getRequiredTimestamp(value.updatedAt, timestampFallback),
  };
};

const sanitizeHistoryEntry = (value: unknown, timestampFallback: string): ProjectHistoryEntry | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const id = getRequiredString(value.id);
  const projectId = getRequiredString(value.projectId);
  const description = getRequiredString(value.description);

  if (!id || !projectId || !description) {
    return undefined;
  }

  return {
    id,
    projectId,
    type: getEnumValue<ProjectHistoryEntryType>(value.type, HISTORY_ENTRY_TYPE_OPTIONS, 'updated'),
    date: getRequiredTimestamp(value.date, timestampFallback),
    description,
    taskId: getOptionalString(value.taskId),
    milestoneId: getOptionalString(value.milestoneId),
    oldValue: getOptionalString(value.oldValue),
    newValue: getOptionalString(value.newValue),
    note: getOptionalString(value.note),
    createdAt: getRequiredTimestamp(value.createdAt, timestampFallback),
    updatedAt: getRequiredTimestamp(value.updatedAt, timestampFallback),
  };
};

const sanitizeArray = <T>(value: unknown, fallback: T[], sanitizeItem: (item: unknown) => T | undefined): T[] => {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value.reduce<T[]>((sanitizedItems, item) => {
    const sanitizedItem = sanitizeItem(item);

    if (sanitizedItem) {
      sanitizedItems.push(sanitizedItem);
    }

    return sanitizedItems;
  }, []);
};

export const getPersistedLifeHQState = (state: PersistableLifeHQState): LifeHQPersistedState => ({
  storageVersion: LIFEHQ_STORAGE_VERSION,
  lifeAreas: state.lifeAreas,
  projects: state.projects,
  tasks: state.tasks,
  milestones: state.milestones,
  historyEntries: state.historyEntries,
});

export const sanitizePersistedLifeHQState = (
  persistedState: unknown,
  fallbackState: PersistableLifeHQState,
): LifeHQPersistedState => {
  if (!isRecord(persistedState)) {
    return getPersistedLifeHQState(fallbackState);
  }

  const timestampFallback = new Date().toISOString();

  return {
    storageVersion: LIFEHQ_STORAGE_VERSION,
    lifeAreas: sanitizeArray(persistedState.lifeAreas, fallbackState.lifeAreas, (item) => sanitizeLifeArea(item, timestampFallback)),
    projects: sanitizeArray(persistedState.projects, fallbackState.projects, (item) => sanitizeProject(item, timestampFallback)),
    tasks: sanitizeArray(persistedState.tasks, fallbackState.tasks, (item) => sanitizeTask(item, timestampFallback)),
    milestones: sanitizeArray(persistedState.milestones, fallbackState.milestones, (item) => sanitizeMilestone(item, timestampFallback)),
    historyEntries: sanitizeArray(persistedState.historyEntries, fallbackState.historyEntries, (item) => sanitizeHistoryEntry(item, timestampFallback)),
  };
};

export const mergePersistedLifeHQState = <T extends PersistableLifeHQState>(persistedState: unknown, currentState: T): T => {
  const sanitizedState = sanitizePersistedLifeHQState(persistedState, currentState);

  return {
    ...currentState,
    lifeAreas: sanitizedState.lifeAreas,
    projects: sanitizedState.projects,
    tasks: sanitizedState.tasks,
    milestones: sanitizedState.milestones,
    historyEntries: sanitizedState.historyEntries,
  };
};

export const createLifeHQStorage = (): PersistStorage<LifeHQPersistedState> | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  let storage: Storage;

  try {
    storage = window.localStorage;
  } catch (error) {
    console.warn('LifeHQ storage is unavailable. Using in-memory initial app data only.', error);
    return undefined;
  }

  return {
    getItem: (name) => {
      try {
        const storedValue = storage.getItem(name);

        if (!storedValue) {
          return null;
        }

        const parsedValue = JSON.parse(storedValue) as StorageValue<LifeHQPersistedState>;

        if (!isRecord(parsedValue) || !('state' in parsedValue)) {
          try {
            storage.removeItem(name);
          } catch {
            // Ignore cleanup failures so invalid storage never blocks app startup.
          }

          return null;
        }

        return parsedValue;
      } catch (error) {
        console.warn('LifeHQ storage could not be read. Falling back to initial app data.', error);

        try {
          storage.removeItem(name);
        } catch {
          // Ignore cleanup failures so corrupted storage never blocks app startup.
        }

        return null;
      }
    },
    setItem: (name, value) => {
      try {
        storage.setItem(name, JSON.stringify(value));
      } catch (error) {
        console.warn('LifeHQ storage could not be written.', error);
      }
    },
    removeItem: (name) => {
      try {
        storage.removeItem(name);
      } catch (error) {
        console.warn('LifeHQ storage could not be cleared.', error);
      }
    },
  };
};
