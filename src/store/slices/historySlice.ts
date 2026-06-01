import type { ProjectHistoryEntry } from '../../models/projectHistory';

export interface HistorySlice {
  historyEntries: ProjectHistoryEntry[];
  addHistoryEntry: (entry: ProjectHistoryEntry) => void;
}
