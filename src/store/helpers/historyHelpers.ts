import type { ProjectHistoryEntry, ProjectHistoryEntryType } from '../../models/projectHistory';

export interface CreateProjectHistoryEntryInput {
  projectId: string;
  type: ProjectHistoryEntryType;
  description: string;
  taskId?: string;
  milestoneId?: string;
  oldValue?: string;
  newValue?: string;
  note?: string;
  date?: string;
}

export function createProjectHistoryEntry(input: CreateProjectHistoryEntryInput): ProjectHistoryEntry {
  const timestamp = input.date ?? new Date().toISOString();

  return {
    id: `h-${Date.now()}`,
    projectId: input.projectId,
    type: input.type,
    date: timestamp,
    description: input.description,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...(input.taskId !== undefined ? { taskId: input.taskId } : {}),
    ...(input.milestoneId !== undefined ? { milestoneId: input.milestoneId } : {}),
    ...(input.oldValue !== undefined ? { oldValue: input.oldValue } : {}),
    ...(input.newValue !== undefined ? { newValue: input.newValue } : {}),
    ...(input.note !== undefined ? { note: input.note } : {}),
  };
}
