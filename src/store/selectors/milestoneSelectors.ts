import type { LifeHQState } from '../useLifeHQStore';

export const selectMilestones = (state: LifeHQState) => state.milestones;
export const selectMilestonesByProjectId = (projectId: string) => (state: LifeHQState) => state.milestones.filter((m) => m.projectId === projectId);
