import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Milestone } from '../../models/milestone';
import type { Priority, ProjectStatus, TrafficLightStatus } from '../../models/common';
import type { LifeArea } from '../../models/lifeArea';
import type { Project } from '../../models/project';
import type { Task } from '../../models/task';
import {
  selectLifeAreaById,
  selectMilestones,
  selectProjects,
  selectTasks,
  useLifeHQStore,
} from '../../store';


type LifeAreaEditDraft = {
  name: string;
  description: string;
};

type ProjectDraft = {
  name: string;
  description: string;
  status: ProjectStatus;
  priority: Priority;
  trafficLightStatus: TrafficLightStatus;
  targetDate: string;
};

const defaultProjectDraft: ProjectDraft = {
  name: '',
  description: '',
  status: 'planned',
  priority: 'medium',
  trafficLightStatus: 'green',
  targetDate: '',
};

function createEntityId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getOptionalFormValue(value: string): string | undefined {
  const trimmedValue = value.trim();

  return trimmedValue ? trimmedValue : undefined;
}

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
  red: 'bg-[#D6AD64] ring-[#D6AD64]/20',
};

const prioritySortOrder: Record<Priority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function getLifeAreaSymbol(lifeAreaName: string): string {
  const normalizedName = lifeAreaName.toLowerCase();

  if (normalizedName.includes('health') || normalizedName.includes('gesund')) return '♡';
  if (normalizedName.includes('career') || normalizedName.includes('karriere') || normalizedName.includes('work')) return '▣';
  if (normalizedName.includes('finance') || normalizedName.includes('finanz')) return '▥';
  if (normalizedName.includes('relationship') || normalizedName.includes('beziehung')) return '♁';
  if (normalizedName.includes('home') || normalizedName.includes('zuhause')) return '⌂';
  if (normalizedName.includes('personal') || normalizedName.includes('entwicklung')) return '◇';

  return '✦';
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

function getLifeAreaDisplayDescription(lifeArea: LifeArea): string {
  if (lifeArea.description) return lifeArea.description;

  const normalizedName = lifeArea.name.toLowerCase();

  if (normalizedName.includes('health') || normalizedName.includes('gesund')) return 'Stärke deinen Körper und Geist.';
  if (normalizedName.includes('career') || normalizedName.includes('karriere')) return 'Entwickle Arbeit, Wirkung und Positionierung bewusst weiter.';
  if (normalizedName.includes('finance') || normalizedName.includes('finanz')) return 'Schaffe Klarheit und finanzielle Freiheit.';
  if (normalizedName.includes('relationship') || normalizedName.includes('beziehung')) return 'Pflege echte Verbindungen.';
  if (normalizedName.includes('personal development') || normalizedName.includes('entwicklung')) return 'Lerne, reflektiere und wachse.';
  if (normalizedName.includes('home') || normalizedName.includes('zuhause')) return 'Gestalte dein Umfeld bewusst und harmonisch.';

  return lifeArea.description ?? 'Dieser Lebensbereich ist bereit für deine nächsten strategischen Vorhaben.';
}

function getProjectCountLabel(projectCount: number): string {
  if (projectCount === 0) return 'Keine Projekte';

  return projectCount === 1 ? '1 Projekt' : `${projectCount} Projekte`;
}

function getOpenTaskLabel(openTaskCount: number): string {
  if (openTaskCount === 0) return 'Keine offenen Aufgaben';

  return openTaskCount === 1 ? '1 offene Aufgabe' : `${openTaskCount} offene Aufgaben`;
}

function getAttentionProjectLabel(attentionProjectCount: number): string {
  if (attentionProjectCount === 0) return 'Kein Projekt bitte prüfen';

  return attentionProjectCount === 1 ? '1 Projekt bitte prüfen' : `${attentionProjectCount} Projekte bitte prüfen`;
}

function getNextMilestoneLabel(projectMilestones: Milestone[]): string {
  const nextMilestone = projectMilestones
    .filter((milestone) => milestone.status !== 'done')
    .sort((firstMilestone, secondMilestone) =>
      (firstMilestone.targetDate ?? '9999-12-31').localeCompare(secondMilestone.targetDate ?? '9999-12-31'),
    )[0];

  return nextMilestone ? nextMilestone.title : 'Kein offenes Etappenziel';
}

function getProjectOpenTasks(project: Project, tasks: Task[]): Task[] {
  return tasks.filter((task) => task.status !== 'done' && task.projectId === project.id);
}

function isAttentionProject(project: Project): boolean {
  return project.priority === 'critical' || project.trafficLightStatus === 'red';
}

interface LifeAreaStatProps {
  label: string;
  value: string;
}

function LifeAreaStat({ label, value }: LifeAreaStatProps) {
  return (
    <div className="lifehq-life-area-stat">
      <p className="lifehq-label">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[#F5F1EA]">{value}</p>
    </div>
  );
}

interface LifeAreaProjectCardProps {
  project: Project;
  milestones: Milestone[];
  openTaskCount: number;
  onProjectSelect: (projectId: string) => void;
}

function LifeAreaProjectCard({ project, milestones, openTaskCount, onProjectSelect }: LifeAreaProjectCardProps) {
  const needsAttention = isAttentionProject(project);
  const isPaused = project.status === 'paused';

  return (
    <button
      type="button"
      onClick={() => onProjectSelect(project.id)}
      className={`lifehq-life-area-project-card group text-left ${needsAttention ? 'border-[#D6AD64]/35' : ''} ${isPaused ? 'opacity-80' : ''}`}
      aria-label={`Projekt ${project.name} öffnen`}
    >
      <div className="lifehq-gold-icon-frame shrink-0" aria-hidden="true">◎</div>

      <div className="min-w-0 flex-1 space-y-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold tracking-tight text-[#F5F1EA] sm:text-xl">{project.name}</h3>
            {isPaused && <span className="lifehq-badge border-amber-200/15 bg-black/20 text-amber-100/85">Bewusst pausiert</span>}
            {needsAttention && <span className="lifehq-badge border-[#D6AD64]/30 bg-[#D6AD64]/10 text-[#F5F1EA]">Bitte prüfen</span>}
          </div>
          <p className="line-clamp-2 max-w-3xl text-sm leading-6 text-[#B8B1A7]">
            {project.description ?? 'Dieses Projekt ist im Lebensbereich strategisch eingeordnet.'}
          </p>
        </div>

        <div className="grid gap-3 text-sm text-[#B8B1A7] sm:grid-cols-2 xl:grid-cols-5">
          <div className="lifehq-life-area-project-meta">
            <p className="lifehq-label">Status</p>
            <p>{projectStatusLabels[project.status]}</p>
          </div>
          <div className="lifehq-life-area-project-meta">
            <p className="lifehq-label">Priorität</p>
            <p>{priorityLabels[project.priority]}</p>
          </div>
          <div className="lifehq-life-area-project-meta">
            <p className="lifehq-label">Zieltermin</p>
            <p>{project.targetDate ?? 'Kein Zieltermin'}</p>
          </div>
          <div className="lifehq-life-area-project-meta">
            <p className="lifehq-label">Offene Aufgaben</p>
            <p>{getOpenTaskLabel(openTaskCount)}</p>
          </div>
          <div className="lifehq-life-area-project-meta sm:col-span-2 xl:col-span-1">
            <p className="lifehq-label">Nächstes Etappenziel</p>
            <p>{getNextMilestoneLabel(milestones)}</p>
          </div>
        </div>
      </div>

      <div className="hidden flex-col items-end gap-4 sm:flex">
        <div className="flex items-center gap-2 text-xs text-[#B8B1A7]">
          <span className={`h-2.5 w-2.5 rounded-full ring-4 ${trafficLightStyles[project.trafficLightStatus]}`} />
          <span>{trafficLightLabels[project.trafficLightStatus]}</span>
        </div>
        <span className="text-2xl text-[#D6AD64]/65 transition-transform group-hover:translate-x-1" aria-hidden="true">›</span>
      </div>
    </button>
  );
}

export function LifeAreaDetailPage() {
  const navigate = useNavigate();
  const { lifeAreaId } = useParams();
  const lifeArea = useLifeHQStore(lifeAreaId ? selectLifeAreaById(lifeAreaId) : () => undefined);
  const projects = useLifeHQStore(selectProjects);
  const tasks = useLifeHQStore(selectTasks);
  const milestones = useLifeHQStore(selectMilestones);
  const updateLifeArea = useLifeHQStore((state) => state.updateLifeArea);
  const deleteLifeArea = useLifeHQStore((state) => state.deleteLifeArea);
  const addProject = useLifeHQStore((state) => state.addProject);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState<LifeAreaEditDraft>(() => ({ name: lifeArea?.name ?? '', description: lifeArea?.description ?? '' }));
  const [editError, setEditError] = useState<string | undefined>();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [projectDraft, setProjectDraft] = useState<ProjectDraft>(defaultProjectDraft);
  const [projectError, setProjectError] = useState<string | undefined>();

  if (!lifeArea) {
    return (
      <div className="mx-auto max-w-[82rem] space-y-7">
        <Link to="/hq" className="lifehq-back-link">← Zurück zum HQ</Link>
        <section className="lifehq-premium-panel p-6 sm:p-8">
          <p className="lifehq-label">Lebensbereich</p>
          <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-[#F5F1EA] sm:text-4xl">Lebensbereich nicht gefunden.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#B8B1A7]">
            Kehre zurück ins HQ und wähle einen vorhandenen Lebensbereich aus.
          </p>
        </section>
      </div>
    );
  }

  const currentLifeArea = lifeArea;
  const lifeAreaProjects = projects
    .filter((project) => project.lifeAreaId === currentLifeArea.id)
    .sort((firstProject, secondProject) => prioritySortOrder[firstProject.priority] - prioritySortOrder[secondProject.priority]);
  const lifeAreaProjectIds = new Set(lifeAreaProjects.map((project) => project.id));
  const openLifeAreaTasks = tasks.filter(
    (task) => task.status !== 'done' && (task.lifeAreaId === currentLifeArea.id || (task.projectId ? lifeAreaProjectIds.has(task.projectId) : false)),
  );
  const attentionProjects = lifeAreaProjects.filter(isAttentionProject);
  const directLifeAreaTasks = tasks.filter((task) => task.lifeAreaId === currentLifeArea.id);
  const canDeleteLifeArea = lifeAreaProjects.length === 0 && directLifeAreaTasks.length === 0;
  const displayName = getLifeAreaDisplayName(currentLifeArea.name);

  const openProjectDetail = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };


  function openEditPanel() {
    setEditDraft({ name: currentLifeArea.name, description: currentLifeArea.description ?? '' });
    setEditError(undefined);
    setIsDeleteConfirmOpen(false);
    setIsEditOpen((current) => !current);
  }

  function updateEditDraft(patch: Partial<LifeAreaEditDraft>) {
    setEditDraft((current) => ({ ...current, ...patch }));
    setEditError(undefined);
  }

  function handleUpdateLifeArea(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = editDraft.name.trim();

    if (!name) {
      setEditError('Bitte gib einen Namen ein.');
      return;
    }

    updateLifeArea(currentLifeArea.id, {
      name,
      description: getOptionalFormValue(editDraft.description),
    });
    setIsEditOpen(false);
  }

  function updateProjectDraft(patch: Partial<ProjectDraft>) {
    setProjectDraft((current) => ({ ...current, ...patch }));
    setProjectError(undefined);
  }

  function resetProjectDraft() {
    setProjectDraft(defaultProjectDraft);
    setProjectError(undefined);
  }

  function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = projectDraft.name.trim();

    if (!name) {
      setProjectError('Bitte gib einen Projektnamen ein.');
      return;
    }

    const timestamp = new Date().toISOString();

    addProject({
      id: createEntityId('p'),
      name,
      description: getOptionalFormValue(projectDraft.description),
      lifeAreaId: currentLifeArea.id,
      status: projectDraft.status,
      priority: projectDraft.priority,
      trafficLightStatus: projectDraft.trafficLightStatus,
      targetDate: projectDraft.targetDate || undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    resetProjectDraft();
    setIsProjectFormOpen(false);
  }

  function handleDeleteLifeArea() {
    deleteLifeArea(currentLifeArea.id);
    navigate('/hq');
  }

  return (
    <div className="mx-auto max-w-[82rem] space-y-8">
      <Link to="/hq" className="lifehq-back-link">← Zurück zum HQ</Link>

      <section className="lifehq-life-area-header p-5 sm:p-7 lg:p-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
          <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-start">
            <div className="lifehq-gold-icon-frame shrink-0 text-3xl" aria-hidden="true">
              {getLifeAreaSymbol(currentLifeArea.name)}
            </div>
            <div className="min-w-0 space-y-4">
              <p className="text-xs uppercase tracking-[0.28em] text-[#D6AD64]/70">Lebensbereich</p>
              <h1 className="break-words font-serif text-4xl font-semibold tracking-tight text-[#F5F1EA] sm:text-5xl lg:text-6xl">{displayName}</h1>
              <p className="max-w-3xl text-base leading-7 text-[#B8B1A7]">
                {getLifeAreaDisplayDescription(currentLifeArea)}
              </p>
            </div>
          </div>

          <aside className="space-y-3">
            <div className="lifehq-life-area-stat-panel">
              <LifeAreaStat label="Projekte" value={getProjectCountLabel(lifeAreaProjects.length)} />
              <LifeAreaStat label="Offene Aufgaben" value={getOpenTaskLabel(openLifeAreaTasks.length)} />
              <LifeAreaStat label="Bitte prüfen" value={getAttentionProjectLabel(attentionProjects.length)} />
            </div>
            <button type="button" onClick={openEditPanel} className="lifehq-button-secondary w-full">Lebensbereich bearbeiten</button>
          </aside>
        </div>
      </section>

      {isEditOpen && (
        <form onSubmit={handleUpdateLifeArea} className="lifehq-crud-panel">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-[#B8B1A7]">
              <span className="lifehq-label">Name</span>
              <input value={editDraft.name} onChange={(event) => updateEditDraft({ name: event.target.value })} className="lifehq-crud-control" />
            </label>
            <label className="space-y-2 text-sm text-[#B8B1A7]">
              <span className="lifehq-label">Beschreibung</span>
              <input value={editDraft.description} onChange={(event) => updateEditDraft({ description: event.target.value })} className="lifehq-crud-control" />
            </label>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {editError ? <p className="text-sm text-[#D6AD64]">{editError}</p> : <p className="text-sm text-[#7E776E]">Name und Beschreibung dieses Lebensbereichs bearbeiten.</p>}
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setIsEditOpen(false)} className="lifehq-button-secondary">Abbrechen</button>
              <button type="submit" className="lifehq-button-primary">Speichern</button>
            </div>
          </div>

          <div className="lifehq-danger-zone mt-6">
            <p className="font-semibold text-[#F5F1EA]">Lebensbereich löschen</p>
            {!canDeleteLifeArea ? (
              <p className="mt-2 text-sm leading-6 text-[#B8B1A7]">Dieser Lebensbereich enthält noch Projekte oder Aufgaben. Entferne oder verschiebe diese zuerst, bevor du ihn löschst.</p>
            ) : isDeleteConfirmOpen ? (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-[#B8B1A7]">Diesen Lebensbereich wirklich löschen?</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setIsDeleteConfirmOpen(false)} className="lifehq-button-secondary">Abbrechen</button>
                  <button type="button" onClick={handleDeleteLifeArea} className="lifehq-button-primary">Endgültig löschen</button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setIsDeleteConfirmOpen(true)} className="lifehq-button-secondary mt-3">Lebensbereich löschen</button>
            )}
          </div>
        </form>
      )}

      <section className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="lifehq-section-title">
              <span aria-hidden="true" />
              <h2 className="font-serif text-2xl font-semibold tracking-tight text-[#F5F1EA]">Projekte in {displayName}</h2>
            </div>
            <p className="text-xs text-[#7E776E]">Sortiert nach: Priorität</p>
          </div>
          <button type="button" onClick={() => setIsProjectFormOpen((current) => !current)} className="lifehq-button-secondary w-fit">Projekt hinzufügen</button>
        </div>

        {isProjectFormOpen && (
          <form onSubmit={handleCreateProject} className="lifehq-crud-panel">
            <div className="grid gap-4 lg:grid-cols-3">
              <label className="space-y-2 text-sm text-[#B8B1A7] lg:col-span-2"><span className="lifehq-label">Projektname</span><input value={projectDraft.name} onChange={(event) => updateProjectDraft({ name: event.target.value })} className="lifehq-crud-control" /></label>
              <label className="space-y-2 text-sm text-[#B8B1A7] lg:col-span-3"><span className="lifehq-label">Beschreibung</span><textarea value={projectDraft.description} onChange={(event) => updateProjectDraft({ description: event.target.value })} className="lifehq-crud-control" rows={3} /></label>
              <label className="space-y-2 text-sm text-[#B8B1A7]"><span className="lifehq-label">Status</span><select value={projectDraft.status} onChange={(event) => updateProjectDraft({ status: event.target.value as ProjectStatus })} className="lifehq-crud-control">{Object.entries(projectStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="space-y-2 text-sm text-[#B8B1A7]"><span className="lifehq-label">Priorität</span><select value={projectDraft.priority} onChange={(event) => updateProjectDraft({ priority: event.target.value as Priority })} className="lifehq-crud-control">{Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="space-y-2 text-sm text-[#B8B1A7]"><span className="lifehq-label">Ampelstatus</span><select value={projectDraft.trafficLightStatus} onChange={(event) => updateProjectDraft({ trafficLightStatus: event.target.value as TrafficLightStatus })} className="lifehq-crud-control">{Object.entries(trafficLightLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="space-y-2 text-sm text-[#B8B1A7]"><span className="lifehq-label">Zieltermin</span><input type="date" value={projectDraft.targetDate} onChange={(event) => updateProjectDraft({ targetDate: event.target.value })} className="lifehq-crud-control" /></label>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {projectError ? <p className="text-sm text-[#D6AD64]">{projectError}</p> : <p className="text-sm text-[#7E776E]">Das Projekt wird automatisch diesem Lebensbereich zugeordnet.</p>}
              <div className="flex flex-wrap gap-2"><button type="button" onClick={() => { resetProjectDraft(); setIsProjectFormOpen(false); }} className="lifehq-button-secondary">Abbrechen</button><button type="submit" className="lifehq-button-primary">Speichern</button></div>
            </div>
          </form>
        )}

        {lifeAreaProjects.length === 0 ? (
          <div className="lifehq-empty-state">
            <p className="font-medium text-[#B8B1A7]">Noch keine Projekte in {displayName}</p>
            <p className="mt-1 text-[#7E776E]">Dieser Lebensbereich ist bereit für die nächsten strategischen Projekte.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {lifeAreaProjects.map((project) => (
              <LifeAreaProjectCard
                key={project.id}
                project={project}
                milestones={milestones.filter((milestone) => milestone.projectId === project.id)}
                openTaskCount={getProjectOpenTasks(project, tasks).length}
                onProjectSelect={openProjectDetail}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
