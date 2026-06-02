import { useEffect, useState } from 'react';
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

type ReactivationStatus = Extract<ProjectStatus, 'active' | 'planned'>;

type PauseDraft = {
  reason: string;
  note: string;
  reviewDate: string;
};

type ReactivationDraft = {
  status: ReactivationStatus;
  priority: Priority;
  trafficLightStatus: TrafficLightStatus;
  targetDate: string;
  description: string;
  note: string;
};

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
  green: 'bg-emerald-300/80 ring-emerald-300/20',
  yellow: 'bg-amber-300/80 ring-amber-300/20',
  red: 'bg-rose-300/80 ring-rose-300/25',
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
  updated: 'Bearbeitet',
  status_changed: 'Status geändert',
  priority_changed: 'Priorität geändert',
  traffic_light_changed: 'Ampel geändert',
  target_date_changed: 'Zieltermin geändert',
  paused: 'Pausiert',
  reactivated: 'Reaktiviert',
  completed: 'Abgeschlossen',
  task_created: 'Aufgabe erstellt',
  task_completed: 'Aufgabe erledigt',
  task_linked: 'Aufgabe verknüpft',
  milestone_created: 'Meilenstein erstellt',
  milestone_completed: 'Meilenstein erledigt',
  milestone_updated: 'Meilenstein aktualisiert',
  note_added: 'Notiz ergänzt',
};

const reactivationStatusOptions: ReactivationStatus[] = ['active', 'planned'];
const priorityOptions: Priority[] = ['low', 'medium', 'high', 'critical'];
const trafficLightOptions: TrafficLightStatus[] = ['green', 'yellow', 'red'];

const defaultPauseDraft: PauseDraft = {
  reason: '',
  note: '',
  reviewDate: '',
};

interface DetailFieldProps {
  label: string;
  value: string;
  description?: string;
}

function DetailField({ label, value, description }: DetailFieldProps) {
  return (
    <div className="lifehq-card-soft flex min-h-28 flex-col justify-between p-4">
      <p className="lifehq-label">{label}</p>
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

function getInitialReactivationDraft(project?: {
  status: ProjectStatus;
  priority: Priority;
  trafficLightStatus: TrafficLightStatus;
  targetDate?: string;
  description?: string;
}): ReactivationDraft {
  return {
    status: project?.status === 'planned' ? 'planned' : 'active',
    priority: project?.priority ?? 'medium',
    trafficLightStatus: project?.trafficLightStatus ?? 'green',
    targetDate: project?.targetDate ?? '',
    description: project?.description ?? '',
    note: '',
  };
}

function getOptionalValue(value: string): string | undefined {
  const trimmedValue = value.trim();

  return trimmedValue ? trimmedValue : undefined;
}

export function ProjectDetailPage() {
  const { projectId } = useParams();
  const project = useLifeHQStore(selectProjectById(projectId ?? ''));
  const lifeArea = useLifeHQStore(selectLifeAreaById(project?.lifeAreaId ?? ''));
  const milestones = useLifeHQStore(selectMilestonesByProjectId(project?.id ?? ''));
  const tasks = useLifeHQStore(selectTasksByProjectId(project?.id ?? ''));
  const historyEntries = useLifeHQStore(selectHistoryByProjectId(project?.id ?? ''));
  const pauseProject = useLifeHQStore((state) => state.pauseProject);
  const reactivateProject = useLifeHQStore((state) => state.reactivateProject);
  const [pauseDraft, setPauseDraft] = useState<PauseDraft>(defaultPauseDraft);
  const [reactivationDraft, setReactivationDraft] = useState<ReactivationDraft>(() => getInitialReactivationDraft());
  const lifeAreaDisplayValue = getLifeAreaDisplayValue(project?.lifeAreaId, lifeArea?.name);
  const nextRelevantMilestoneLabel = getNextRelevantMilestoneLabel(milestones);
  const openTaskLabel = getOpenTaskLabel(tasks);
  const sortedHistoryEntries = getSortedHistoryEntries(historyEntries);
  const isPausedProject = project?.status === 'paused';
  const canPauseProject = Boolean(project && project.status !== 'paused' && project.status !== 'completed');
  const hasPauseInformation = Boolean(isPausedProject || project?.pausedAt || project?.pauseReason || project?.pauseNote || project?.reviewDate);
  const hasReactivationInformation = Boolean(project?.reactivatedAt || project?.reactivationNote);

  useEffect(() => {
    setPauseDraft(defaultPauseDraft);
    setReactivationDraft(getInitialReactivationDraft(project));
  }, [project?.id, project?.status]);

  function updatePauseDraft(patch: Partial<PauseDraft>) {
    setPauseDraft((current) => ({ ...current, ...patch }));
  }

  function updateReactivationDraft(patch: Partial<ReactivationDraft>) {
    setReactivationDraft((current) => ({ ...current, ...patch }));
  }

  function handlePauseProject() {
    if (!project) {
      return;
    }

    pauseProject(project.id, {
      reason: getOptionalValue(pauseDraft.reason),
      note: getOptionalValue(pauseDraft.note),
      reviewDate: pauseDraft.reviewDate || undefined,
    });
    setPauseDraft(defaultPauseDraft);
  }

  function handleReactivateProject() {
    if (!project) {
      return;
    }

    reactivateProject(project.id, {
      status: reactivationDraft.status,
      priority: reactivationDraft.priority,
      trafficLightStatus: reactivationDraft.trafficLightStatus,
      targetDate: reactivationDraft.targetDate || undefined,
      description: getOptionalValue(reactivationDraft.description),
      note: getOptionalValue(reactivationDraft.note),
    });
  }

  if (!project) {
    return (
      <div className="space-y-7">
        <Link to="/hq" className="lifehq-button-secondary w-fit">
          ← Zurück zum HQ
        </Link>
        <section className="lifehq-panel p-6">
          <p className="lifehq-label">Project Detail</p>
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
      <Link to="/hq" className="lifehq-button-secondary w-fit">
        ← Zurück zum HQ
      </Link>

      <section className="lifehq-panel-strong p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <p className="lifehq-label">Project Detail</p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-100 sm:text-4xl">{project.name}</h2>
            <p className="lifehq-card-soft p-4 text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
              {project.description ?? 'Für dieses Projekt ist noch keine Beschreibung oder Vision hinterlegt.'}
            </p>
            {isPausedProject && (
              <p className="lifehq-note">
                Dieses Projekt ist bewusst pausiert. Es bleibt gespeichert und kann später wieder aufgenommen werden.
              </p>
            )}
          </div>

          {isPausedProject && (
            <span className="lifehq-badge w-fit">
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
          <DetailField
            label="Status"
            value={projectStatusLabels[project.status]}
            description={isPausedProject ? 'Bewusst pausiert, nicht abgeschlossen und nicht verloren.' : undefined}
          />
          <DetailField label="Priorität" value={priorityLabels[project.priority]} />
          <div className="lifehq-card-soft p-4">
            <p className="lifehq-label">Ampelstatus</p>
            <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-100">
              <span className={`h-2.5 w-2.5 rounded-full ring-4 ${trafficLightStyles[project.trafficLightStatus]}`} />
              <span>{trafficLightLabels[project.trafficLightStatus]}</span>
            </div>
          </div>
          <DetailField label="Zieltermin" value={project.targetDate ?? 'Kein Zieltermin'} />
          <DetailField label="Nächster Meilenstein" value={nextRelevantMilestoneLabel} />
          <DetailField label="Offene Aufgaben" value={openTaskLabel} />
        </div>
      </section>

      {canPauseProject && (
        <section className="lifehq-panel p-5 sm:p-6">
          <div className="max-w-2xl">
            <p className="lifehq-label">Focus Decision</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-100">Projekt pausieren</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Pausieren nimmt dieses Projekt bewusst aus dem aktiven Fokus. Es bleibt gespeichert und kann später wieder aufgenommen werden.
            </p>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <label className="space-y-2 text-sm text-slate-300">
              <span className="lifehq-label">Pausierungsgrund</span>
              <input
                value={pauseDraft.reason}
                onChange={(event) => updatePauseDraft({ reason: event.target.value })}
                placeholder="Warum ruht dieses Projekt gerade?"
                className="w-full rounded-2xl border border-slate-700/70 bg-slate-950/40 px-4 py-3 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-slate-400"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              <span className="lifehq-label">Wiedervorlage</span>
              <input
                type="date"
                value={pauseDraft.reviewDate}
                onChange={(event) => updatePauseDraft({ reviewDate: event.target.value })}
                className="w-full rounded-2xl border border-slate-700/70 bg-slate-950/40 px-4 py-3 text-sm text-slate-100 outline-none transition-colors focus:border-slate-400"
              />
            </label>
            <button
              type="button"
              onClick={handlePauseProject}
              className="lifehq-button-secondary w-fit lg:mb-1"
            >
              Projekt pausieren
            </button>
          </div>

          <label className="mt-4 block space-y-2 text-sm text-slate-300">
            <span className="lifehq-label">Pausierungsnotiz</span>
            <textarea
              value={pauseDraft.note}
              onChange={(event) => updatePauseDraft({ note: event.target.value })}
              placeholder="Optionale Notiz für den späteren Wiedereinstieg."
              rows={3}
              className="w-full rounded-2xl border border-slate-700/70 bg-slate-950/40 px-4 py-3 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-slate-400"
            />
          </label>
        </section>
      )}

      {hasPauseInformation && (
        <section className="lifehq-panel p-5 sm:p-6">
          <div className="max-w-2xl">
            <p className="lifehq-label">Paused Project</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-100">Pausierungsinformationen</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Dieses Projekt ist bewusst pausiert oder wurde bewusst pausiert. Es bleibt gespeichert und kann später wieder aufgenommen werden.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <DetailField label="Pausierungsdatum" value={project.pausedAt ?? 'Kein Pausierungsdatum hinterlegt'} />
            <DetailField label="Pausierungsgrund" value={project.pauseReason ?? 'Kein Pausierungsgrund hinterlegt'} />
            <DetailField label="Pausierungsnotiz" value={project.pauseNote ?? 'Keine Pausierungsnotiz hinterlegt'} />
            <DetailField label="Wiedervorlage" value={project.reviewDate ?? 'Keine Wiedervorlage hinterlegt'} />
          </div>

          {isPausedProject && (
            <div className="mt-6 rounded-3xl border border-slate-700/50 bg-slate-900/25 p-4 sm:p-5">
              <div className="max-w-2xl">
                <p className="lifehq-label">Return to Focus</p>
                <h4 className="mt-2 text-base font-semibold text-slate-100">Projekt reaktivieren</h4>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Reaktivieren bringt dieses Projekt zurück in den geplanten oder aktiven Arbeitszustand.
                </p>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <label className="space-y-2 text-sm text-slate-300">
                  <span className="lifehq-label">Neuer Status</span>
                  <select
                    value={reactivationDraft.status}
                    onChange={(event) => updateReactivationDraft({ status: event.target.value as ReactivationStatus })}
                    className="w-full rounded-2xl border border-slate-700/70 bg-slate-950/40 px-4 py-3 text-sm text-slate-100 outline-none transition-colors focus:border-slate-400"
                  >
                    {reactivationStatusOptions.map((status) => (
                      <option key={status} value={status}>{projectStatusLabels[status]}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm text-slate-300">
                  <span className="lifehq-label">Priorität</span>
                  <select
                    value={reactivationDraft.priority}
                    onChange={(event) => updateReactivationDraft({ priority: event.target.value as Priority })}
                    className="w-full rounded-2xl border border-slate-700/70 bg-slate-950/40 px-4 py-3 text-sm text-slate-100 outline-none transition-colors focus:border-slate-400"
                  >
                    {priorityOptions.map((priority) => (
                      <option key={priority} value={priority}>{priorityLabels[priority]}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm text-slate-300">
                  <span className="lifehq-label">Ampelstatus</span>
                  <select
                    value={reactivationDraft.trafficLightStatus}
                    onChange={(event) => updateReactivationDraft({ trafficLightStatus: event.target.value as TrafficLightStatus })}
                    className="w-full rounded-2xl border border-slate-700/70 bg-slate-950/40 px-4 py-3 text-sm text-slate-100 outline-none transition-colors focus:border-slate-400"
                  >
                    {trafficLightOptions.map((status) => (
                      <option key={status} value={status}>{trafficLightLabels[status]}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm text-slate-300">
                  <span className="lifehq-label">Zieltermin</span>
                  <input
                    type="date"
                    value={reactivationDraft.targetDate}
                    onChange={(event) => updateReactivationDraft({ targetDate: event.target.value })}
                    className="w-full rounded-2xl border border-slate-700/70 bg-slate-950/40 px-4 py-3 text-sm text-slate-100 outline-none transition-colors focus:border-slate-400"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
                  <span className="lifehq-label">Beschreibung</span>
                  <textarea
                    value={reactivationDraft.description}
                    onChange={(event) => updateReactivationDraft({ description: event.target.value })}
                    rows={3}
                    className="w-full rounded-2xl border border-slate-700/70 bg-slate-950/40 px-4 py-3 text-sm text-slate-100 outline-none transition-colors focus:border-slate-400"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-300 xl:col-span-3">
                  <span className="lifehq-label">Reaktivierungsnotiz</span>
                  <textarea
                    value={reactivationDraft.note}
                    onChange={(event) => updateReactivationDraft({ note: event.target.value })}
                    placeholder="Optionale Notiz für den Neustart."
                    rows={3}
                    className="w-full rounded-2xl border border-slate-700/70 bg-slate-950/40 px-4 py-3 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-slate-400"
                  />
                </label>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={handleReactivateProject}
                  className="lifehq-button-primary"
                >
                  Projekt reaktivieren
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {hasReactivationInformation && (
        <section className="lifehq-panel p-5 sm:p-6">
          <div className="max-w-2xl">
            <p className="lifehq-label">Project Return</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-100">Reaktivierungsinformationen</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Diese Informationen halten fest, wann das Projekt wieder bewusst aufgenommen wurde.
            </p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <DetailField label="Reaktivierungsdatum" value={project.reactivatedAt ?? 'Kein Reaktivierungsdatum hinterlegt'} />
            <DetailField label="Reaktivierungsnotiz" value={project.reactivationNote ?? 'Keine Reaktivierungsnotiz hinterlegt'} />
          </div>
        </section>
      )}

      <section className="lifehq-panel-strong p-5 sm:p-6">
        <div className="max-w-2xl">
          <p className="lifehq-label">Project Markers</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-100">Meilensteine</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Größere Fortschrittspunkte dieses Projekts. Sie geben Orientierung, ohne daraus eine Aufgabenliste zu machen.
          </p>
        </div>

        {milestones.length === 0 ? (
          <p className="lifehq-empty-state mt-5">
            Für dieses Projekt sind noch keine Meilensteine hinterlegt.
          </p>
        ) : (
          <div className="mt-5 grid gap-3">
            {milestones.map((milestone) => (
              <article key={milestone.id} className={`lifehq-card-soft p-4 transition-colors ${milestone.status === 'done' ? 'opacity-70' : 'hover:border-slate-600/60'}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-slate-100">{milestone.title}</h4>
                    {milestone.description && <p className="text-sm leading-6 text-slate-400">{milestone.description}</p>}
                  </div>
                  <span className="lifehq-badge w-fit">
                    {milestoneStatusLabels[milestone.status]}
                  </span>
                </div>
                <p className="lifehq-label mt-3">
                  Zieltermin: {milestone.targetDate ?? 'Kein Zieltermin'}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="lifehq-panel p-5 sm:p-6">
        <div className="max-w-2xl">
          <p className="lifehq-label">Project Execution Context</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-100">Projektaufgaben</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Operative Bezugspunkte dieses Projekts. Sie bleiben kompakt und dienen hier nur der strategischen Einordnung.
          </p>
        </div>

        {tasks.length === 0 ? (
          <p className="lifehq-empty-state mt-5">
            Für dieses Projekt sind noch keine Aufgaben hinterlegt.
          </p>
        ) : (
          <div className="mt-5 grid gap-2">
            {tasks.map((task) => (
              <article key={task.id} className={`lifehq-card-soft p-4 transition-colors ${task.status === 'done' ? 'opacity-70' : 'hover:border-slate-600/60'}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-slate-100">{task.title}</h4>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                      <span className="lifehq-badge">{taskStatusLabels[task.status]}</span>
                      <span className="lifehq-badge">Priorität: {priorityLabels[task.priority]}</span>
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

      <section className="lifehq-panel p-5 sm:p-6">
        <div className="max-w-2xl">
          <p className="lifehq-label">Project Trace</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-100">Projektverlauf</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Ein kompakter Verlauf wichtiger Projektbewegungen. Dieser Bereich bleibt bewusst sekundär und ruhig.
          </p>
        </div>

        {sortedHistoryEntries.length === 0 ? (
          <p className="lifehq-empty-state mt-5">
            Für dieses Projekt gibt es noch keine Verlaufseinträge.
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {sortedHistoryEntries.map((entry) => (
              <article key={entry.id} className="lifehq-card-soft p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <p className="lifehq-label">{historyTypeLabels[entry.type]}</p>
                    <p className="text-sm leading-6 text-slate-300">{entry.description}</p>
                  </div>
                  <p className="text-xs text-slate-500 sm:text-right">{entry.date}</p>
                </div>

                {(entry.taskId || entry.milestoneId || entry.oldValue || entry.newValue || entry.note) && (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                    {entry.taskId && <span className="lifehq-badge">Task: {entry.taskId}</span>}
                    {entry.milestoneId && <span className="lifehq-badge">Meilenstein: {entry.milestoneId}</span>}
                    {entry.oldValue && <span className="lifehq-badge">Vorher: {entry.oldValue}</span>}
                    {entry.newValue && <span className="lifehq-badge">Neu: {entry.newValue}</span>}
                    {entry.note && <span className="lifehq-badge">Notiz: {entry.note}</span>}
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
