import type { LifeHQState } from '../useLifeHQStore';

export const selectFocuses = (state: LifeHQState) => state.focuses;
export const selectFocusById = (focusId: string) => (state: LifeHQState) => state.focuses.find((focus) => focus.id === focusId);
export const selectActiveFocuses = (state: LifeHQState) => state.focuses.filter((focus) => focus.status === 'Active');
export const selectArchivedFocuses = (state: LifeHQState) => state.focuses.filter((focus) => focus.status === 'Archived');
