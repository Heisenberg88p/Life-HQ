import type { LifeHQState } from '../useLifeHQStore';

export const selectTrueNorths = (state: LifeHQState) => state.trueNorths;
export const selectTrueNorthById = (trueNorthId: string) => (state: LifeHQState) => state.trueNorths.find((trueNorth) => trueNorth.id === trueNorthId);
