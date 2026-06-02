import type { StorageValue, PersistStorage } from 'zustand/middleware';
import type { LifeArea } from '../models/lifeArea';
import type { Milestone } from '../models/milestone';
import type { Project } from '../models/project';
import type { ProjectHistoryEntry } from '../models/projectHistory';
import type { Task } from '../models/task';

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

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const getPersistedArray = <T>(value: unknown, fallback: T[]) => (Array.isArray(value) ? value as T[] : fallback);

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

  return {
    storageVersion: LIFEHQ_STORAGE_VERSION,
    lifeAreas: getPersistedArray(persistedState.lifeAreas, fallbackState.lifeAreas),
    projects: getPersistedArray(persistedState.projects, fallbackState.projects),
    tasks: getPersistedArray(persistedState.tasks, fallbackState.tasks),
    milestones: getPersistedArray(persistedState.milestones, fallbackState.milestones),
    historyEntries: getPersistedArray(persistedState.historyEntries, fallbackState.historyEntries),
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
