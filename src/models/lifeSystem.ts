import type { BaseEntity } from './common';

export interface LifeSystem extends BaseEntity {
  name: string;
  description?: string;
  visionId?: string;
  currentPhaseId?: string;
  legacyLifeAreaId?: string;
}
