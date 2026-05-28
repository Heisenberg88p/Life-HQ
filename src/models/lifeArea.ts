import type { BaseEntity, Priority, TrafficLightStatus } from './common';

export interface LifeArea extends BaseEntity {
  name: string;
  description?: string;
  status?: TrafficLightStatus;
  priority?: Priority;
}
