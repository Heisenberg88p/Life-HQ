import type { BaseEntity } from './common';

export type LifeSystemPhaseStatus = 'planned' | 'active' | 'completed' | 'archived';

export interface LifeSystemPhase extends BaseEntity {
  lifeSystemId: string;
  title: string;
  description?: string;
  status: LifeSystemPhaseStatus;
  order: number;
}
