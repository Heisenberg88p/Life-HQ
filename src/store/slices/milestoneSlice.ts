import type { MilestoneStatus } from '../../models/common';
import type { Milestone } from '../../models/milestone';

export interface MilestoneSlice {
  milestones: Milestone[];
  addMilestone: (milestone: Milestone) => void;
  updateMilestone: (id: string, patch: Partial<Milestone>) => void;
  deleteMilestone: (id: string) => void;
  updateMilestoneStatus: (id: string, status: MilestoneStatus) => void;
  completeMilestone: (id: string) => void;
}
