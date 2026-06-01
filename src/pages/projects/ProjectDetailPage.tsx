import { Link, useParams } from 'react-router-dom';
import type { MilestoneStatus, Priority, ProjectStatus, TaskStatus, TrafficLightStatus } from '../../models/common';
import type { Milestone } from '../../models/milestone';
import type { ProjectHistoryEntry, ProjectHistoryEntryType } from '../../models/projectHistory';
import type { Task } from '../../models/task';
import {
  selectHistoryByProjectId,
  selectLifeAreaById,
  selectMilestonesByProjectId,
  selectProjectById,
  selectTasksByProjectId,
  useLifeHQStore,
} from '../../store';

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

const milestoneStatusLabels: Record<MilestoneStatus, string> = {
  open: 'Offen',
  in_progress: 'In Arbeit',
  done: 'Erledigt',
};

const taskStatusLabels: Record<TaskStatus, string> = {
  open: 'Offen',
  in_progress: 'In Arbeit',
  done: 'Erledigt',
};

const historyTypeLabels: Record<ProjectHistoryEntryType, string> = {
  created: 'Erstellt',
  status_changed: 'Status geändert',
  priority_changed: 'Priorität geändert',
  paused: 'Pausiert',
  reactivated: 'Reaktiviert',
  completed: 'Abgeschlossen',
  task_linked: 'Aufgabe verknüpft',
  milestone_updated: 'Meilenstein aktualisiert',
  note_added: 'Notiz ergänzt',
};

interface DetailFieldProps {
  label: string;
  value: string;
  description?: string;
}

function DetailField({ label, value, description }: DetailFieldProps) {
  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-950/25 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-100">{value}</p>
      {description && <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>}
    </div>
  );
}

function getLifeAreaDisplayValue(lifeAreaId?: string, lifeAreaName?: string): string {
  if (!lifeAreaId) {
    return 'Nicht zugeordnet';
  }

  return lifeAreaName ?? 'Lebensbereich nicht gefunden';
}

function getNextRelevantMilestoneLabel(milestones: Milestone[]): string {
  const openMilestones = milestones
    .filter((milestone) => milestone.status !== 'done')
    .sort((a, b) => (a.targetDate ?? '9999-12-31').localeCompare(b.targetDate ?? '9999-12-31'));

  const nextMilestone = openMilestones[0];

  return nextMilestone ? nextMilestone.title : 'Kein offener Meilenstein';
}

function getOpenTaskLabel(tasks: Task[]): string {
  const openTaskCount = tasks.filter((task) => task.status !== 'done').length;

  if (openTaskCount === 0) {
    return 'Keine offenen Aufgaben';
  }

  return openTaskCount === 1 ? '1 offene Aufgabe' : `${openTaskCount} offene Aufgaben`;
}

function getSortedHistoryEntries(historyEntries: ProjectHistoryEntry[]): ProjectHistoryEntry[] {
  return [...historyEntries].sort((entryA, entryB) => entryB.date.localeCompare(entryA.date));
}

export function ProjectDetailPage() {
  const { projectId } = useParams();
  const project = useLifeHQStore(selectProjectById(projectId ?? ''));
  const lifeArea = useLifeHQStore(selectLifeAreaById(project?.lifeAreaId ?? ''));
  const milestones = useLifeHQStore(selectMilestonesByProjectId(project?.id ?? ''));
  const tasks = useLifeHQStore(selectTasksByProjectId(project?.id ?? ''));
  const historyEntries = useLifeHQStore(selectHistoryByProjectId(project?.id ?? ''));
  const lifeAreaDisplayValue = getLifeAreaDisplayValue(project?.lifeAreaId, lifeArea?.name);
  const nextRelevantMilestoneLabel = getNextRelevantMilestoneLabel(milestones);
  const openTaskLabel = getOpenTaskLabel(tasks);
  const sortedHistoryEntries = getSortedHistoryEntries(historyEntries);

  if (!project) {
    return (
      <div className="space-y-6">
        <Link to="/hq" className="text-sm font-medium text-slate-300 transition-colors hover:text-white">
          ← Zurück zum HQ
        </Link>
        <section className="rounded-3xl border border-slate-700/60 bg-slate-900/30 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Project Detail</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-100">Projekt nicht gefunden</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Dieses Projekt ist im aktuellen HQ-State nicht vorhanden. Kehre zurück ins HQ und wähle ein vorhandenes Projekt aus.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/hq" className="text-sm font-medium text-slate-300 transition-colors hover:text-white">
        ← Zurück zum HQ
      </Link>

      <section className="rounded-3xl border border-slate-700/60 bg-slate-900/35 p-5 shadow-lg shadow-black/5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Project Detail</p>
            <h2 className="text-2xl font-semibold text-slate-100 sm:text-3xl">{project.name}</h2>
            <p className="text-sm leading-6 text-slate-300">
              {project.description ?? 'Für dieses Projekt ist noch keine Beschreibung oder Vision hinterlegt.'}
            </p>
          </div>

          {project.status === 'paused' && (
            <span className="w-fit rounded-full border border-slate-600/60 bg-slate-950/40 px-3 py-1 text-xs font-medium text-slate-300">
              Bewusst pausiert
            </span>
          )}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <DetailField
            label="Lebensbereich"
            value={lifeAreaDisplayValue}
            description="Strategischer Kontext dieses Projekts, ohne die Projektansicht zu verlassen."
          />
          <DetailField label="Status" value={projectStatusLabels[project.status]} />
          <DetailField label="Priorität" value={priorityLabels[project.priority]} />
          <div className="rounded-2xl border border-slate-700/50 bg-slate-950/25 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">Ampelstatus</p>
            <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-100">
              <span className={`h-2.5 w-2.5 rounded-full ${trafficLightStyles[project.trafficLightStatus]}`} />
              <span>{trafficLightLabels[project.trafficLightStatus]}</span>
            </div>
          </div>
          <DetailField label="Zieltermin" value={project.targetDate ?? 'Kein Zieltermin'} />
          <DetailField label="Nächster Meilenstein" value={nextRelevantMilestoneLabel} />
          <DetailField label="Offene Aufgaben" value={openTaskLabel} />
          {project.status === 'paused' && <DetailField label="Pausierungsgrund" value={project.pauseReason ?? 'Kein Grund hinterlegt'} />}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-700/60 bg-slate-900/25 p-5 sm:p-6">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Project Markers</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-100">Meilensteine</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Größere Fortschrittspunkte dieses Projekts. Sie geben Orientierung, ohne daraus eine Aufgabenliste zu machen.
          </p>
        </div>

        {milestones.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-dashed border-slate-700/70 bg-slate-950/10 px-4 py-3 text-sm leading-6 text-slate-500">
            Für dieses Projekt sind noch keine Meilensteine hinterlegt.
          </p>
        ) : (
          <div className="mt-5 grid gap-3">
            {milestones.map((milestone) => (
              <article key={milestone.id} className="rounded-2xl border border-slate-700/50 bg-slate-950/25 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-slate-100">{milestone.title}</h4>
                    {milestone.description && <p className="text-sm leading-6 text-slate-400">{milestone.description}</p>}
                  </div>
                  <span className="w-fit rounded-full border border-slate-700/60 bg-slate-950/40 px-2.5 py-1 text-xs text-slate-300">
                    {milestoneStatusLabels[milestone.status]}
                  </span>
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.16em] text-muted">
                  Zieltermin: {milestone.targetDate ?? 'Kein Zieltermin'}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-700/50 bg-slate-950/15 p-5 sm:p-6">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Project Execution Context</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-100">Projektaufgaben</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Operative Bezugspunkte dieses Projekts. Sie bleiben kompakt und dienen hier nur der strategischen Einordnung.
          </p>
        </div>

        {tasks.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-dashed border-slate-700/70 bg-slate-950/10 px-4 py-3 text-sm leading-6 text-slate-500">
            Für dieses Projekt sind noch keine Aufgaben hinterlegt.
          </p>
        ) : (
          <div className="mt-5 grid gap-2">
            {tasks.map((task) => (
              <article key={task.id} className="rounded-2xl border border-slate-700/40 bg-slate-950/20 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-slate-100">{task.title}</h4>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                      <span className="rounded-full border border-slate-700/60 bg-slate-950/40 px-2.5 py-1">{taskStatusLabels[task.status]}</span>
                      <span className="rounded-full border border-slate-700/60 bg-slate-950/40 px-2.5 py-1">Priorität: {priorityLabels[task.priority]}</span>
                    </div>
                  </div>
                  <div className="text-xs leading-5 text-slate-500 sm:text-right">
                    <p>Fälligkeit: {task.dueDate ?? 'Keine Fälligkeit'}</p>
                    <p>Geplant: {task.plannedDate ?? 'Nicht geplant'}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-700/40 bg-slate-950/10 p-5 sm:p-6">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Project Trace</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-100">Projektverlauf</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Ein kompakter Verlauf wichtiger Projektbewegungen. Dieser Bereich bleibt bewusst sekundär und ruhig.
          </p>
        </div>

        {sortedHistoryEntries.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-dashed border-slate-700/70 bg-slate-950/10 px-4 py-3 text-sm leading-6 text-slate-500">
            Für dieses Projekt gibt es noch keine Verlaufseinträge.
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {sortedHistoryEntries.map((entry) => (
              <article key={entry.id} className="rounded-2xl border border-slate-700/40 bg-slate-950/15 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted">{historyTypeLabels[entry.type]}</p>
                    <p className="text-sm leading-6 text-slate-300">{entry.description}</p>
                  </div>
                  <p className="text-xs text-slate-500 sm:text-right">{entry.date}</p>
                </div>

                {(entry.taskId || entry.milestoneId || entry.oldValue || entry.newValue) && (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                    {entry.taskId && <span className="rounded-full border border-slate-700/50 px-2.5 py-1">Task: {entry.taskId}</span>}
                    {entry.milestoneId && <span className="rounded-full border border-slate-700/50 px-2.5 py-1">Meilenstein: {entry.milestoneId}</span>}
                    {entry.oldValue && <span className="rounded-full border border-slate-700/50 px-2.5 py-1">Vorher: {entry.oldValue}</span>}
                    {entry.newValue && <span className="rounded-full border border-slate-700/50 px-2.5 py-1">Neu: {entry.newValue}</span>}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
