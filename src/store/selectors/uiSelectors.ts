import type { LifeHQState } from '../useLifeHQStore';

export const selectUiState = (state: LifeHQState) => state.uiState;
export const selectSelectedProjectId = (state: LifeHQState) => state.uiState.selectedProjectId;
