import type { PersistableLifeHQState } from './persistence';
import { LIFEHQ_STORAGE_VERSION, sanitizePersistedLifeHQState } from './persistence';

export const LIFEHQ_BACKUP_EXPORT_VERSION = 1;

export interface LifeHQBackupMetadata {
  appName: 'LifeHQ';
  exportVersion: number;
  exportedAt: string;
  source: 'local-browser';
  storageVersion: number;
}

export interface LifeHQBackupFile {
  metadata: LifeHQBackupMetadata;
  data: PersistableLifeHQState;
}

export type LifeHQBackupParseResult =
  | { ok: true; backup: LifeHQBackupFile }
  | { ok: false; error: string };

const EMPTY_LIFEHQ_DATA: PersistableLifeHQState = {
  lifeAreas: [],
  projects: [],
  tasks: [],
  milestones: [],
  historyEntries: [],
};

const LIFEHQ_BACKUP_ARRAY_KEYS = ['lifeAreas', 'projects', 'tasks', 'milestones', 'historyEntries'] as const;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const getBackupData = (value: unknown): unknown => {
  if (!isRecord(value)) {
    return undefined;
  }

  if ('data' in value) {
    return value.data;
  }

  return value;
};

const hasLifeHQBackupMetadata = (value: unknown): boolean => {
  if (!isRecord(value) || !isRecord(value.metadata)) {
    return false;
  }

  return value.metadata.appName === 'LifeHQ' && typeof value.metadata.exportVersion === 'number';
};

const getSanitizedArrayLength = (data: PersistableLifeHQState, key: (typeof LIFEHQ_BACKUP_ARRAY_KEYS)[number]) => data[key].length;

export const createLifeHQBackup = (state: PersistableLifeHQState, exportedAt = new Date()): LifeHQBackupFile => ({
  metadata: {
    appName: 'LifeHQ',
    exportVersion: LIFEHQ_BACKUP_EXPORT_VERSION,
    exportedAt: exportedAt.toISOString(),
    source: 'local-browser',
    storageVersion: LIFEHQ_STORAGE_VERSION,
  },
  data: {
    lifeAreas: state.lifeAreas,
    projects: state.projects,
    tasks: state.tasks,
    milestones: state.milestones,
    historyEntries: state.historyEntries,
  },
});

export const serializeLifeHQBackup = (state: PersistableLifeHQState, exportedAt = new Date()): string => JSON.stringify(
  createLifeHQBackup(state, exportedAt),
  null,
  2,
);

export const getLifeHQBackupFileName = (exportedAt = new Date()): string => {
  const timestamp = exportedAt.toISOString().slice(0, 16).replace('T', '-').replace(':', '-');

  return `lifehq-backup-${timestamp}.json`;
};

export const parseLifeHQBackup = (value: unknown): LifeHQBackupParseResult => {
  const data = getBackupData(value);

  if (!isRecord(data)) {
    return { ok: false, error: 'Die Datei enthält keine gültige LifeHQ-Backup-Struktur.' };
  }

  const hasWrappedBackupShape = isRecord(value) && 'metadata' in value && 'data' in value;

  if (hasWrappedBackupShape && !hasLifeHQBackupMetadata(value)) {
    return { ok: false, error: 'Die Backup-Metadaten passen nicht zu LifeHQ.' };
  }

  const invalidArrayKey = LIFEHQ_BACKUP_ARRAY_KEYS.find((key) => !Array.isArray(data[key]));

  if (invalidArrayKey) {
    return { ok: false, error: `Die Backup-Daten sind unvollständig: ${invalidArrayKey} fehlt oder ist keine Liste.` };
  }

  const sanitizedData = sanitizePersistedLifeHQState(data, EMPTY_LIFEHQ_DATA);
  const invalidItemKey = LIFEHQ_BACKUP_ARRAY_KEYS.find((key) => {
    const sourceItems = data[key];

    return Array.isArray(sourceItems) && sourceItems.length !== getSanitizedArrayLength(sanitizedData, key);
  });

  if (invalidItemKey) {
    return { ok: false, error: `Die Backup-Daten enthalten ungültige Einträge in ${invalidItemKey}.` };
  }

  return {
    ok: true,
    backup: {
      metadata: {
        appName: 'LifeHQ',
        exportVersion: LIFEHQ_BACKUP_EXPORT_VERSION,
        exportedAt: isRecord(value) && isRecord(value.metadata) && typeof value.metadata.exportedAt === 'string'
          ? value.metadata.exportedAt
          : new Date().toISOString(),
        source: 'local-browser',
        storageVersion: LIFEHQ_STORAGE_VERSION,
      },
      data: {
        lifeAreas: sanitizedData.lifeAreas,
        projects: sanitizedData.projects,
        tasks: sanitizedData.tasks,
        milestones: sanitizedData.milestones,
        historyEntries: sanitizedData.historyEntries,
      },
    },
  };
};

export const parseLifeHQBackupJson = (json: string): LifeHQBackupParseResult => {
  try {
    return parseLifeHQBackup(JSON.parse(json));
  } catch {
    return { ok: false, error: 'Die Datei konnte nicht als JSON gelesen werden.' };
  }
};
