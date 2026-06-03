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
  green: 'bg-[#8E9B72] ring-[#8E9B72]/20',
  yellow: 'bg-[#D6AD64] ring-[#D6AD64]/20',
  red: 'bg-[#B36A4C] ring-[#B36A4C]/25',
};

interface ProjectCardProps {
  project: Project;
  lifeArea?: LifeArea;
  tasks: Task[];
  milestones: Milestone[];
  onClick?: (projectId: string) => void;
}


function getLifeAreaDisplayName(lifeAreaName: string): string {
  const normalizedName = lifeAreaName.toLowerCase();

  if (normalizedName.includes('health') || normalizedName.includes('gesund')) return 'Gesundheit';
  if (normalizedName.includes('career') || normalizedName.includes('karriere')) return 'Karriere';
  if (normalizedName.includes('finance') || normalizedName.includes('finanz')) return 'Finanzen';
  if (normalizedName.includes('relationship') || normalizedName.includes('beziehung')) return 'Beziehungen';
  if (normalizedName.includes('personal development') || normalizedName.includes('entwicklung')) return 'Persönliche Entwicklung';
  if (normalizedName.includes('home') || normalizedName.includes('zuhause')) return 'Zuhause';
  if (normalizedName.includes('family') || normalizedName.includes('familie')) return 'Familie';
  if (normalizedName.includes('business')) return 'Business';
  if (normalizedName.includes('work') || normalizedName.includes('arbeit')) return 'Arbeit';
  if (normalizedName.includes('sport')) return 'Sport';
  if (normalizedName.includes('nutrition') || normalizedName.includes('ernährung')) return 'Ernährung';

  return lifeAreaName;
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
  const lifeAreaLabel = lifeArea ? getLifeAreaDisplayName(lifeArea.name) : 'Kein Lebensbereich';

  return (
    <button
      type="button"
      onClick={() => onClick?.(project.id)}
      className={`lifehq-premium-card group w-full p-4 text-left focus-visible:outline-offset-4 sm:p-5 ${
        isPaused ? 'opacity-85' : ''
      } ${isCritical ? 'border-amber-300/35 shadow-amber-950/10' : ''}`}
      aria-label={`Projekt ${project.name}`}
    >
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="text-xs text-[#D6AD64]/65">{lifeAreaLabel}</p>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-lg font-semibold tracking-tight text-[#F5F1EA] group-hover:text-white sm:text-xl">{project.name}</h4>
              {isPaused && <span className="lifehq-badge border-amber-200/15 bg-black/20 text-amber-100/85">Bewusst pausiert</span>}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-[#B8B1A7] sm:justify-end">
            <span className="lifehq-badge">Status: {projectStatusLabels[project.status]}</span>
            <span className={project.priority === 'critical' ? 'lifehq-badge border-amber-300/25 bg-amber-950/15 text-amber-100' : 'lifehq-badge'}>
              Priorität: {priorityLabels[project.priority]}
            </span>
          </div>
        </div>

        {strategicSignalLabels.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs text-amber-100">
            {strategicSignalLabels.map((label) => (
              <span key={label} className="lifehq-badge border-amber-300/25 bg-amber-950/15 text-amber-100">
                {label}
              </span>
            ))}
          </div>
        )}

        <div className="grid gap-3 text-sm text-[#B8B1A7] sm:grid-cols-2">
          <div className="lifehq-card-soft border-white/10 bg-black/20 px-3 py-3">
            <p className="lifehq-label">Ampel</p>
            <div className="mt-2 flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ring-4 ${trafficLightStyles[project.trafficLightStatus]}`} />
              <span>{trafficLightLabels[project.trafficLightStatus]}</span>
            </div>
          </div>

          <div className="lifehq-card-soft border-white/10 bg-black/20 px-3 py-3">
            <p className="lifehq-label">Zieltermin</p>
            <p className="mt-2 font-medium text-[#F5F1EA]">{project.targetDate ?? 'Kein Zieltermin'}</p>
          </div>
        </div>

        <div className="grid gap-2 text-sm leading-6 text-[#B8B1A7] sm:grid-cols-2">
          <div className="lifehq-card-soft border-white/10 bg-black/20 px-3 py-2">
            <p>{getOpenTaskLabel(projectTasks)}</p>
          </div>
          <div className="lifehq-card-soft border-white/10 bg-black/20 px-3 py-2">
            <p>{getNextMilestoneLabel(projectMilestones)}</p>
          </div>
        </div>

        {isPaused && (
          <div className="lifehq-card-soft border-amber-200/10 bg-black/20 px-3 py-3 text-sm leading-6 text-[#B8B1A7]">
            <p className="font-medium text-[#F5F1EA]">Bewusst pausiert, nicht abgeschlossen.</p>
            {project.pauseReason && <p className="mt-1 line-clamp-2">Grund: {project.pauseReason}</p>}
            {project.reviewDate && <p className="mt-1">Wiedervorlage: {project.reviewDate}</p>}
          </div>
        )}
      </div>
    </button>
  );
}
