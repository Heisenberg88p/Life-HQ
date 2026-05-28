import type { LifeArea } from '../../models/lifeArea';

export interface LifeAreaSlice {
  lifeAreas: LifeArea[];
  addLifeArea: (lifeArea: LifeArea) => void;
  updateLifeArea: (id: string, patch: Partial<LifeArea>) => void;
  deleteLifeArea: (id: string) => void;
}
