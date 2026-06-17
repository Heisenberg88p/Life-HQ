import type { LifeHQState } from '../useLifeHQStore';

export const selectLifeSystemPhases = (state: LifeHQState) => state.lifeSystemPhases;
export const selectLifeSystemPhaseById = (phaseId: string) => (state: LifeHQState) => state.lifeSystemPhases.find((phase) => phase.id === phaseId);
export const selectLifeSystemPhasesByLifeSystemId = (lifeSystemId: string) => (state: LifeHQState) => state.lifeSystemPhases.filter((phase) => phase.lifeSystemId === lifeSystemId);
