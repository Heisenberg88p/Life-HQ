import type { LifeHQState } from '../useLifeHQStore';

export const selectLifeSystems = (state: LifeHQState) => state.lifeSystems;
export const selectLifeSystemById = (lifeSystemId: string) => (state: LifeHQState) => state.lifeSystems.find((lifeSystem) => lifeSystem.id === lifeSystemId);
