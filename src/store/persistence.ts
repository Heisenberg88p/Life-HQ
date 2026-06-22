import type { StorageValue, PersistStorage } from 'zustand/middleware';
import { isValidDateString, safeNormalizeDate } from '../logic/dateLogic';
import type { Priority, ProjectStatus, TrafficLightStatus, TaskStatus, MilestoneStatus } from '../models/common';
import type { Focus, FocusPriority, FocusStatus } from '../models/focus';
import type { LifeArea } from '../models/lifeArea';
import type { LifeSystem } from '../models/lifeSystem';
import type { LifeSystemPhase, LifeSystemPhaseStatus } from '../models/lifeSystemPhase';
import type { Milestone } from '../models/milestone';
import type { Project } from '../models/project';
import type { ProjectHistoryEntry, ProjectHistoryEntryType } from '../models/projectHistory';
import type { Task } from '../models/task';
import type { TrueNorth } from '../models/trueNorth';
import type { Vision } from '../models/vision';
import {
  MILESTONE_STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  PROJECT_STATUS_OPTIONS,
  TASK_STATUS_OPTIONS,
  TRAFFIC_LIGHT_STATUS_OPTIONS,
} from '../constants/statusOptions';
import { migrateLifeAreasToLifeSystems } from './migrations';

export const LIFEHQ_STORAGE_KEY = 'lifehq-v1-storage';
export const LIFEHQ_STORAGE_VERSION = 7;

export interface PersistableLifeHQState {
  visions: Vision[];
  lifeSystems: LifeSystem[];
  lifeSystemPhases: LifeSystemPhase[];
  focuses: Focus[];
  trueNorths: TrueNorth[];
  lifeAreas: LifeArea[];
  projects: Project[];
  tasks: Task[];
  milestones: Milestone[];
  historyEntries: ProjectHistoryEntry[];
}

export interface LifeHQPersistedState extends PersistableLifeHQState {
  storageVersion: number;
}

const LIFE_SYSTEM_PHASE_STATUS_OPTIONS: LifeSystemPhaseStatus[] = ['planned', 'active', 'completed', 'archived'];
const FOCUS_STATUS_OPTIONS: FocusStatus[] = ['Active', 'Paused', 'Completed', 'Archived'];
const FOCUS_PRIORITY_OPTIONS: FocusPriority[] = ['High', 'Medium', 'Low'];

const getTodayDateOnly = () => new Date().toISOString().slice(0, 10);

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
const getNumber = (value: unknown, fallback: number): number => (typeof value === 'number' && Number.isFinite(value) ? value : fallback);

const sanitizeLifeSystemPhase = (value: unknown, timestampFallback: string): LifeSystemPhase | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const id = getRequiredString(value.id);
  const lifeSystemId = getRequiredString(value.lifeSystemId);
  const title = getRequiredString(value.title);

  if (!id || !lifeSystemId || !title) {
    return undefined;
  }

  return {
    id,
    lifeSystemId,
    title,
    description: getOptionalString(value.description),
    status: getEnumValue<LifeSystemPhaseStatus>(value.status, LIFE_SYSTEM_PHASE_STATUS_OPTIONS, 'planned'),
    order: getNumber(value.order, 0),
    createdAt: getRequiredTimestamp(value.createdAt, timestampFallback),
    updatedAt: getRequiredTimestamp(value.updatedAt, timestampFallback),
  };
};

const sanitizeLifeSystem = (value: unknown, timestampFallback: string): LifeSystem | undefined => {
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
    visionId: getOptionalString(value.visionId),
    currentPhaseId: getOptionalString(value.currentPhaseId),
    legacyLifeAreaId: getOptionalString(value.legacyLifeAreaId),
    createdAt: getRequiredTimestamp(value.createdAt, timestampFallback),
    updatedAt: getRequiredTimestamp(value.updatedAt, timestampFallback),
  };
};

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
    lifeSystemId: getOptionalString(value.lifeSystemId),
    focusId: getOptionalString(value.focusId) ?? null,
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
    lifeSystemId: getOptionalString(value.lifeSystemId),
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

const sanitizeVision = (value: unknown, timestampFallback: string): Vision | undefined => {
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
    createdAt: getRequiredTimestamp(value.createdAt, timestampFallback),
    updatedAt: getRequiredTimestamp(value.updatedAt, timestampFallback),
  };
};

const sanitizeFocus = (value: unknown, timestampFallback: string): Focus | undefined => {
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
    status: getEnumValue<FocusStatus>(value.status, FOCUS_STATUS_OPTIONS, 'Active'),
    priority: getEnumValue<FocusPriority>(value.priority, FOCUS_PRIORITY_OPTIONS, 'Medium'),
    startDate: getOptionalDateOnly(value.startDate) ?? getTodayDateOnly(),
    targetDate: getOptionalDateOnly(value.targetDate),
    trueNorthReference: getOptionalString(value.trueNorthReference),
    createdAt: getRequiredTimestamp(value.createdAt, timestampFallback),
    updatedAt: getRequiredTimestamp(value.updatedAt, timestampFallback),
  };
};


const shouldMigrateLifeAreasToLifeSystems = (persistedState: Record<string, unknown>): boolean => {
  if (typeof persistedState.storageVersion === 'number') {
    return persistedState.storageVersion < 7;
  }

  return !Array.isArray(persistedState.lifeSystems);
};

const sanitizeTrueNorth = (value: unknown, timestampFallback: string): TrueNorth | undefined => {
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
    createdAt: getRequiredTimestamp(value.createdAt, timestampFallback),
    updatedAt: getRequiredTimestamp(value.updatedAt, timestampFallback),
  };
};

export const getPersistedLifeHQState = (state: PersistableLifeHQState): LifeHQPersistedState => ({
  storageVersion: LIFEHQ_STORAGE_VERSION,
  visions: state.visions,
  lifeSystems: state.lifeSystems,
  lifeSystemPhases: state.lifeSystemPhases,
  focuses: state.focuses,
  trueNorths: state.trueNorths,
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

  const visions = sanitizeArray(persistedState.visions, fallbackState.visions, (item) => sanitizeVision(item, timestampFallback));
  const lifeSystems = sanitizeArray(persistedState.lifeSystems, fallbackState.lifeSystems, (item) => sanitizeLifeSystem(item, timestampFallback));
  const validLifeSystemIds = new Set(lifeSystems.map((lifeSystem) => lifeSystem.id));
  const lifeSystemPhases = sanitizeArray(persistedState.lifeSystemPhases, fallbackState.lifeSystemPhases, (item) => sanitizeLifeSystemPhase(item, timestampFallback))
    .filter((phase) => validLifeSystemIds.has(phase.lifeSystemId));
  const validLifeSystemPhaseIdsByLifeSystemId = new Map<string, Set<string>>();

  lifeSystemPhases.forEach((phase) => {
    const phaseIds = validLifeSystemPhaseIdsByLifeSystemId.get(phase.lifeSystemId) ?? new Set<string>();
    phaseIds.add(phase.id);
    validLifeSystemPhaseIdsByLifeSystemId.set(phase.lifeSystemId, phaseIds);
  });

  const sanitizedLifeSystems = lifeSystems.map((lifeSystem) => ({
    ...lifeSystem,
    currentPhaseId: lifeSystem.currentPhaseId && validLifeSystemPhaseIdsByLifeSystemId.get(lifeSystem.id)?.has(lifeSystem.currentPhaseId)
      ? lifeSystem.currentPhaseId
      : undefined,
  }));
  const focuses = sanitizeArray(persistedState.focuses, fallbackState.focuses, (item) => sanitizeFocus(item, timestampFallback));
  const validFocusIds = new Set(focuses.map((focus) => focus.id));
  const projects = sanitizeArray(persistedState.projects, fallbackState.projects, (item) => sanitizeProject(item, timestampFallback))
    .map((project) => ({
      ...project,
      lifeSystemId: project.lifeSystemId && validLifeSystemIds.has(project.lifeSystemId) ? project.lifeSystemId : undefined,
      focusId: project.focusId && validFocusIds.has(project.focusId) ? project.focusId : null,
    }));
  const lifeAreas = sanitizeArray(persistedState.lifeAreas, fallbackState.lifeAreas, (item) => sanitizeLifeArea(item, timestampFallback));
  const validProjectIds = new Set(projects.map((project) => project.id));
  const migratedState = shouldMigrateLifeAreasToLifeSystems(persistedState)
    ? migrateLifeAreasToLifeSystems({
      lifeAreas,
      lifeSystems: sanitizedLifeSystems,
      projects,
    }, timestampFallback)
    : {
      lifeAreas,
      lifeSystems: sanitizedLifeSystems,
      projects,
    };

  return {
    storageVersion: LIFEHQ_STORAGE_VERSION,
    visions,
    lifeSystems: migratedState.lifeSystems,
    lifeSystemPhases,
    focuses,
    trueNorths: sanitizeArray(persistedState.trueNorths, fallbackState.trueNorths, (item) => sanitizeTrueNorth(item, timestampFallback)),
    lifeAreas: migratedState.lifeAreas,
    projects: migratedState.projects,
    tasks: sanitizeArray(persistedState.tasks, fallbackState.tasks, (item) => sanitizeTask(item, timestampFallback))
      .map((task) => {
        const project = task.projectId && validProjectIds.has(task.projectId)
          ? migratedState.projects.find((item) => item.id === task.projectId)
          : undefined;

        return {
          ...task,
          projectId: project?.id,
          lifeSystemId: project?.lifeSystemId ?? (task.lifeSystemId && validLifeSystemIds.has(task.lifeSystemId) ? task.lifeSystemId : undefined),
        };
      }),
    milestones: sanitizeArray(persistedState.milestones, fallbackState.milestones, (item) => sanitizeMilestone(item, timestampFallback)),
    historyEntries: sanitizeArray(persistedState.historyEntries, fallbackState.historyEntries, (item) => sanitizeHistoryEntry(item, timestampFallback)),
  };
};

export const mergePersistedLifeHQState = <T extends PersistableLifeHQState>(persistedState: unknown, currentState: T): T => {
  const sanitizedState = sanitizePersistedLifeHQState(persistedState, currentState);

  return {
    ...currentState,
    visions: sanitizedState.visions,
    lifeSystems: sanitizedState.lifeSystems,
    lifeSystemPhases: sanitizedState.lifeSystemPhases,
    focuses: sanitizedState.focuses,
    trueNorths: sanitizedState.trueNorths,
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
