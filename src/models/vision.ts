import type { BaseEntity } from './common';

export interface Vision extends BaseEntity {
  title: string;
  description?: string;
}
