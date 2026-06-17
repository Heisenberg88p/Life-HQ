import type { LifeSystem } from '../../models/lifeSystem';

export interface LifeSystemSlice {
  lifeSystems: LifeSystem[];
  createLifeSystem: (lifeSystem: LifeSystem) => void;
  updateLifeSystem: (id: string, patch: Partial<LifeSystem>) => void;
  deleteLifeSystem: (id: string) => void;
}
