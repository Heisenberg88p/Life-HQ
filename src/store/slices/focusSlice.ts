import type { Focus } from '../../models/focus';

export interface FocusSlice {
  focuses: Focus[];
  createFocus: (focus: Focus) => void;
  updateFocus: (id: string, patch: Partial<Focus>) => void;
  archiveFocus: (id: string) => void;
}
