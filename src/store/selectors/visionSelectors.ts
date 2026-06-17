import type { LifeHQState } from '../useLifeHQStore';

export const selectVisions = (state: LifeHQState) => state.visions;
export const selectVisionById = (visionId: string) => (state: LifeHQState) => state.visions.find((vision) => vision.id === visionId);
