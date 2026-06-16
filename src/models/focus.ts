import type { BaseEntity } from './common';

export type FocusStatus = 'Active' | 'Paused' | 'Completed' | 'Archived';

export type FocusPriority = 'High' | 'Medium' | 'Low';

export interface Focus extends BaseEntity {
  id: string;
  title: string;
  description?: string;
  status: FocusStatus;
  priority: FocusPriority;
  startDate: string;
  targetDate?: string;
  trueNorthReference?: string;
}
