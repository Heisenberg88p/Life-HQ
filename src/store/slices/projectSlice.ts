import type { Priority, ProjectStatus, TrafficLightStatus } from '../../models/common';
import type { Project } from '../../models/project';

export interface ProjectSlice {
  projects: Project[];
  addProject: (project: Project) => void;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  pauseProject: (id: string, reason?: string, note?: string) => void;
  reactivateProject: (id: string, note?: string) => void;
  updateProjectStatus: (id: string, status: ProjectStatus) => void;
  updateProjectPriority: (id: string, priority: Priority) => void;
  updateProjectTrafficLightStatus: (id: string, trafficLightStatus: TrafficLightStatus) => void;
}
