import type { LifeSystemPhase } from '../../models/lifeSystemPhase';

export interface LifeSystemPhaseSlice {
  lifeSystemPhases: LifeSystemPhase[];
  createLifeSystemPhase: (phase: LifeSystemPhase) => void;
  updateLifeSystemPhase: (id: string, patch: Partial<LifeSystemPhase>) => void;
  deleteLifeSystemPhase: (id: string) => void;
  setCurrentLifeSystemPhase: (lifeSystemId: string, phaseId?: string) => void;
}
