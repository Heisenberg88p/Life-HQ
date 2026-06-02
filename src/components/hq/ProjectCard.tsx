import type { LifeArea } from '../../models/lifeArea';
import type { Milestone } from '../../models/milestone';
import type { Priority, ProjectStatus, TrafficLightStatus } from '../../models/common';
import type { Project } from '../../models/project';
import type { Task } from '../../models/task';

const projectStatusLabels: Record<ProjectStatus, string> = {
  planned: 'Geplant',
  active: 'Aktiv',
  paused: 'Pausiert',
  completed: 'Abgeschlossen',
};

const priorityLabels: Record<Priority, string> = {
  low: 'Niedrig',
  medium: 'Mittel',
  high: 'Hoch',
  critical: 'Kritisch',
};

const trafficLightLabels: Record<TrafficLightStatus, string> = {
  green: 'Grün',
  yellow: 'Gelb',
  red: 'Rot',
};

const trafficLightStyles: Record<TrafficLightStatus, string> = {
  green: 'bg-emerald-300/80',
  yellow: 'bg-amber-300/80',
  red: 'bg-rose-300/80',
};

interface ProjectCardProps {
  project: Project;
  lifeArea?: LifeArea;
  tasks: Task[];
  milestones: Milestone[];
  onClick?: (projectId: string) => void;
}

function getOpenTaskLabel(tasks: Task[]): string {
  const openTaskCount = tasks.filter((task) => task.status !== 'done').length;

  if (openTaskCount === 0) {
    return 'Keine offenen Aufgaben';
  }

  return openTaskCount === 1 ? '1 offene Aufgabe' : `${openTaskCount} offene Aufgaben`;
}

function getNextMilestoneLabel(milestones: Milestone[]): string {
  const nextMilestone = milestones.find((milestone) => milestone.status !== 'done');

  return nextMilestone ? `Nächster Meilenstein: ${nextMilestone.title}` : 'Kein Meilenstein gesetzt';
}

function getStrategicSignalLabels(project: Project): string[] {
  return [
    project.priority === 'critical' ? 'Kritische Priorität' : undefined,
    project.trafficLightStatus === 'red' ? 'Rote Ampel' : undefined,
    project.status === 'paused' && (project.priority === 'critical' || project.trafficLightStatus === 'red') ? 'Pausiert, Signal bleibt sichtbar' : undefined,
  ].filter((label): label is string => Boolean(label));
}

export function ProjectCard({ project, lifeArea, tasks, milestones, onClick }: ProjectCardProps) {
  const isPaused = project.status === 'paused';
  const isCritical = project.priority === 'critical' || project.trafficLightStatus === 'red';
  const projectTasks = tasks.filter((task) => task.projectId === project.id);
  const projectMilestones = milestones.filter((milestone) => milestone.projectId === project.id);
  const strategicSignalLabels = getStrategicSignalLabels(project);

  return (
    <button
      type="button"
      onClick={() => onClick?.(project.id)}
      className={`group w-full rounded-3xl border p-5 text-left shadow-lg shadow-black/5 transition-colors ${
        isPaused
          ? 'border-slate-700/50 bg-slate-950/25 opacity-90 hover:border-slate-600/80 hover:bg-slate-950/35'
          : 'border-slate-700/60 bg-slate-900/40 hover:border-slate-500/80 hover:bg-slate-900/60'
      } ${isCritical ? 'border-l-4 border-l-rose-300/70' : 'border-l-4 border-l-slate-700/60'}`}
      aria-label={`Projekt ${project.name}`}
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">{lifeArea?.name ?? 'Kein Lebensbereich'}</p>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-lg font-semibold text-slate-100 group-hover:text-white">{project.name}</h4>
              {isPaused && (
                <span className="rounded-full border border-slate-600/70 bg-slate-950/50 px-2.5 py-1 text-xs font-medium text-slate-300">
                  Bewusst pausiert
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-slate-300 sm:justify-end">
            <span className="rounded-full border border-slate-700/60 bg-slate-950/40 px-2.5 py-1">{projectStatusLabels[project.status]}</span>
            <span className={project.priority === 'critical' ? 'rounded-full border border-rose-300/30 bg-rose-950/30 px-2.5 py-1 text-rose-100' : 'rounded-full border border-slate-700/60 bg-slate-950/40 px-2.5 py-1'}>
              {priorityLabels[project.priority]}
            </span>
          </div>
        </div>

        {strategicSignalLabels.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs text-rose-100">
            {strategicSignalLabels.map((label) => (
              <span key={label} className="rounded-full border border-rose-300/20 bg-rose-950/20 px-2.5 py-1">
                {label}
              </span>
            ))}
          </div>
        )}

        <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-700/40 bg-slate-950/25 px-3 py-2">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">Ampel</p>
            <div className="mt-2 flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${trafficLightStyles[project.trafficLightStatus]}`} />
              <span>{trafficLightLabels[project.trafficLightStatus]}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700/40 bg-slate-950/25 px-3 py-2">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">Zieltermin</p>
            <p className="mt-2">{project.targetDate ?? 'Kein Zieltermin'}</p>
          </div>
        </div>

        <div className="space-y-2 text-sm leading-6 text-slate-300">
          <p>{getOpenTaskLabel(projectTasks)}</p>
          <p>{getNextMilestoneLabel(projectMilestones)}</p>
          {isPaused && (
            <div className="rounded-2xl border border-slate-700/50 bg-slate-950/25 px-3 py-2 text-slate-400">
              <p className="font-medium text-slate-300">Bewusst pausiert, nicht abgeschlossen.</p>
              {project.pauseReason && <p className="mt-1 line-clamp-2">Grund: {project.pauseReason}</p>}
              {project.reviewDate && <p className="mt-1">Wiedervorlage: {project.reviewDate}</p>}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
