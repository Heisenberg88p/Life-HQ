import type { LifeHQState } from '../useLifeHQStore';

export const selectHistoryEntries = (state: LifeHQState) => state.historyEntries;
export const selectHistoryByProjectId = (projectId: string) => (state: LifeHQState) =>
  state.historyEntries.filter((entry) => entry.projectId === projectId);
