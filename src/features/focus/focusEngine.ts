import { safeNormalizeDate } from '../../logic/dateLogic';
import type { LifeSystem } from '../../models/lifeSystem';
import type { LifeSystemPhase } from '../../models/lifeSystemPhase';
import type { Milestone } from '../../models/milestone';
import type { Project } from '../../models/project';
import type { Task } from '../../models/task';
import type { Vision } from '../../models/vision';

export type FocusCandidateSourceType = 'project' | 'task' | 'milestone' | 'lifeSystem';

export type FocusCandidateReason =
  | 'high-priority'
  | 'critical-priority'
  | 'due-soon'
  | 'due-today'
  | 'overdue'
  | 'red-traffic-light'
  | 'yellow-traffic-light'
  | 'active-project'
  | 'active-life-system-phase';

export type FocusCandidateSignalValue = string | number | boolean | null;

export interface FocusCandidate {
  id: string;
  sourceType: FocusCandidateSourceType;
  sourceId: string;
  title: string;
  description?: string;
  lifeSystemId?: string;
  projectId?: string;
  taskId?: string;
  milestoneId?: string;
  reasons: FocusCandidateReason[];
  signals: Record<string, FocusCandidateSignalValue>;
  createdAt?: string;
}

export interface FocusEngineState {
  projects: Project[];
  tasks: Task[];
  milestones: Milestone[];
  lifeSystems: LifeSystem[];
  lifeSystemPhases: LifeSystemPhase[];
  visions?: Vision[];
}

export interface BuildFocusCandidatesOptions {
  referenceDate?: string | Date;
}

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function addDays(date: string, days: number): string {
  const match = DATE_ONLY_PATTERN.exec(date);

  if (!match) {
    return date;
  }

  const targetDate = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  targetDate.setDate(targetDate.getDate() + days);

  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getDateReasons(date: string | undefined, referenceDate: string): FocusCandidateReason[] {
  const normalizedDate = safeNormalizeDate(date);

  if (!normalizedDate) {
    return [];
  }

  if (normalizedDate < referenceDate) {
    return ['overdue'];
  }

  if (normalizedDate === referenceDate) {
    return ['due-today'];
  }

  return normalizedDate <= addDays(referenceDate, 7) ? ['due-soon'] : [];
}

function getProjectReasons(project: Project, referenceDate: string): FocusCandidateReason[] {
  if (project.status === 'completed') {
    return [];
  }

  const reasons: FocusCandidateReason[] = [];

  if (project.priority === 'critical') {
    reasons.push('critical-priority');
  } else if (project.priority === 'high') {
    reasons.push('high-priority');
  }

  if (project.trafficLightStatus === 'red') {
    reasons.push('red-traffic-light');
  } else if (project.trafficLightStatus === 'yellow') {
    reasons.push('yellow-traffic-light');
  }

  reasons.push(...getDateReasons(project.targetDate, referenceDate));

  if (project.status === 'active' && reasons.length > 0) {
    reasons.push('active-project');
  }

  return reasons;
}

function getTaskReasons(task: Task, referenceDate: string): FocusCandidateReason[] {
  if (task.status === 'done') {
    return [];
  }

  const reasons: FocusCandidateReason[] = [];

  if (task.priority === 'critical') {
    reasons.push('critical-priority');
  } else if (task.priority === 'high') {
    reasons.push('high-priority');
  }

  reasons.push(...getDateReasons(task.dueDate, referenceDate));

  return reasons;
}

export function buildFocusCandidates(
  state: FocusEngineState,
  options: BuildFocusCandidatesOptions = {},
): FocusCandidate[] {
  const referenceDate = safeNormalizeDate(options.referenceDate ?? new Date());

  if (!referenceDate) {
    return [];
  }

  const projectsById = new Map(state.projects.map((project) => [project.id, project]));
  const phasesById = new Map(state.lifeSystemPhases.map((phase) => [phase.id, phase]));
  const candidates: FocusCandidate[] = [];

  state.projects.forEach((project) => {
    const reasons = getProjectReasons(project, referenceDate);

    if (reasons.length === 0) {
      return;
    }

    candidates.push({
      id: `project:${project.id}`,
      sourceType: 'project',
      sourceId: project.id,
      title: project.name,
      description: project.description,
      lifeSystemId: project.lifeSystemId,
      projectId: project.id,
      reasons,
      signals: {
        status: project.status,
        priority: project.priority,
        trafficLightStatus: project.trafficLightStatus,
        targetDate: project.targetDate ?? null,
      },
      createdAt: project.createdAt,
    });
  });

  state.tasks.forEach((task) => {
    const reasons = getTaskReasons(task, referenceDate);

    if (reasons.length === 0) {
      return;
    }

    const project = task.projectId ? projectsById.get(task.projectId) : undefined;

    candidates.push({
      id: `task:${task.id}`,
      sourceType: 'task',
      sourceId: task.id,
      title: task.title,
      description: task.description,
      lifeSystemId: project?.lifeSystemId,
      projectId: task.projectId,
      taskId: task.id,
      reasons,
      signals: {
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ?? null,
        plannedDate: task.plannedDate ?? null,
      },
      createdAt: task.createdAt,
    });
  });

  state.milestones.forEach((milestone) => {
    if (milestone.status === 'done') {
      return;
    }

    const reasons = getDateReasons(milestone.targetDate, referenceDate);

    if (reasons.length === 0) {
      return;
    }

    const project = projectsById.get(milestone.projectId);

    candidates.push({
      id: `milestone:${milestone.id}`,
      sourceType: 'milestone',
      sourceId: milestone.id,
      title: milestone.title,
      description: milestone.description,
      lifeSystemId: project?.lifeSystemId,
      projectId: milestone.projectId,
      milestoneId: milestone.id,
      reasons,
      signals: {
        status: milestone.status,
        targetDate: milestone.targetDate ?? null,
      },
      createdAt: milestone.createdAt,
    });
  });

  state.lifeSystems.forEach((lifeSystem) => {
    const currentPhase = lifeSystem.currentPhaseId ? phasesById.get(lifeSystem.currentPhaseId) : undefined;

    if (!currentPhase || currentPhase.lifeSystemId !== lifeSystem.id || currentPhase.status !== 'active') {
      return;
    }

    candidates.push({
      id: `lifeSystem:${lifeSystem.id}`,
      sourceType: 'lifeSystem',
      sourceId: lifeSystem.id,
      title: lifeSystem.name,
      description: lifeSystem.description,
      lifeSystemId: lifeSystem.id,
      reasons: ['active-life-system-phase'],
      signals: {
        currentPhaseId: currentPhase.id,
        currentPhaseTitle: currentPhase.title,
        currentPhaseStatus: currentPhase.status,
        currentPhaseOrder: currentPhase.order,
      },
      createdAt: lifeSystem.createdAt,
    });
  });

  return candidates;
}
