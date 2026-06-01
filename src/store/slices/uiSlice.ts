export interface UIState {
  activeMainView: 'hq' | 'tasks';
  selectedProjectId?: string;
}

export interface UISlice {
  uiState: UIState;
  setActiveMainView: (view: UIState['activeMainView']) => void;
  setSelectedProject: (projectId: string) => void;
  clearSelectedProject: () => void;
}
