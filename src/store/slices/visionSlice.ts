import type { Vision } from '../../models/vision';

export interface VisionSlice {
  visions: Vision[];
  addVision: (vision: Vision) => void;
  updateVision: (id: string, patch: Partial<Vision>) => void;
  deleteVision: (id: string) => void;
}
