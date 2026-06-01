import type { LifeHQState } from '../useLifeHQStore';

export const selectLifeAreas = (state: LifeHQState) => state.lifeAreas;
export const selectLifeAreaById = (lifeAreaId: string) => (state: LifeHQState) => state.lifeAreas.find((lifeArea) => lifeArea.id === lifeAreaId);
