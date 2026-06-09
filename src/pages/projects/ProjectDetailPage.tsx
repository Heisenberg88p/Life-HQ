import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  milestoneStatusLabels,
  milestoneStatusOptions,
  priorityLabels,
  priorityOptions,
  projectStatusLabels,
  projectStatusOptions,
  taskStatusLabels,
  taskStatusOptions,
  trafficLightLabels,
  trafficLightOptions,
} from '../../constants/displayLabels';
import type { MilestoneStatus, Priority, ProjectStatus, TaskStatus, TrafficLightStatus } from '../../models/common';
import type { Milestone } from '../../models/milestone';
import type { ProjectHistoryEntry, ProjectHistoryEntryType } from '../../models/projectHistory';
import type { Task } from '../../models/task';
import {
  selectHistoryByProjectId,
  selectLifeAreas,
  selectMilestonesByProjectId,
  selectProjectById,
  selectTasksByProjectId,
  useLifeHQStore,
} from '../../store';
import { formatDateDisplay } from '../../utils/dateFormat';

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

type ProjectEditDraft = {
  name: string;
  description: string;
  lifeAreaId: string;
  status: ProjectStatus;
  priority: Priority;
  trafficLightStatus: TrafficLightStatus;
  targetDate: string;
};

type MilestoneDraft = {
  title: string;
  description: string;
  status: MilestoneStatus;
  targetDate: string;
};

type ProjectTaskDraft = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string;
  plannedDate: string;
};

const trafficLightStyles: Record<TrafficLightStatus, string> = {
  green: 'bg-emerald-300/80 ring-emerald-300/20',
  yellow: 'bg-amber-300/80 ring-amber-300/20',
  red: 'bg-rose-300/80 ring-rose-300/25',
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
const defaultPauseDraft: PauseDraft = {
  reason: '',
  note: '',
  reviewDate: '',
};

const defaultMilestoneDraft: MilestoneDraft = {
  title: '',
  description: '',
  status: 'open',
  targetDate: '',
};

const defaultProjectTaskDraft: ProjectTaskDraft = {
  title: '',
  description: '',
  status: 'open',
  priority: 'medium',
  dueDate: '',
  plannedDate: '',
};

interface ProjectStatusCardProps {
  label: string;
  value: string;
  icon: string;
  children?: ReactNode;
}

function ProjectStatusCard({ label, value, icon, children }: ProjectStatusCardProps) {
  return (
    <article className="lifehq-project-status-card">
      <div className="flex items-start gap-3">
        <span className="lifehq-project-status-icon" aria-hidden="true">{icon}</span>
        <div className="min-w-0">
          <p className="lifehq-label">{label}</p>
          <div className="mt-2 break-words text-sm font-semibold leading-6 text-[#F5F1EA]">{children ?? value}</div>
        </div>
      </div>
    </article>
  );
}

interface ProjectSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  secondary?: boolean;
}

function ProjectSection({ title, description, children, secondary = false }: ProjectSectionProps) {
  return (
    <section className={secondary ? 'lifehq-project-section lifehq-project-section-secondary' : 'lifehq-project-section'}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="lifehq-section-title">
            <span aria-hidden="true" />
            <h3 className="font-serif text-2xl font-semibold tracking-tight text-[#F5F1EA]">{title}</h3>
          </div>
          {description && <p className="max-w-2xl text-sm leading-6 text-[#7E776E]">{description}</p>}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}


function formatHistoryValue(value: string): string {
  return formatDateDisplay(value, value);
}

function getMilestoneMarkerClass(status: MilestoneStatus): string {
  if (status === 'done') return 'border-white/10 bg-white/[0.04] text-[#7E776E]';
  if (status === 'in_progress') return 'border-[#D6AD64]/35 bg-[#D6AD64]/10 text-[#D6AD64]';

  return 'border-white/10 bg-black/30 text-[#B8B1A7]';
}

function getTaskMarkerClass(status: TaskStatus): string {
  if (status === 'done') return 'border-white/10 bg-white/[0.04]';
  if (status === 'in_progress') return 'border-[#D6AD64]/35 bg-[#D6AD64]/20';

  return 'border-white/10 bg-black/30';
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

function getLifeAreaDisplayValue(lifeAreaId?: string, lifeAreaName?: string): string {
  if (!lifeAreaId) {
    return 'Nicht zugeordnet';
  }

  return lifeAreaName ? getLifeAreaDisplayName(lifeAreaName) : 'Lebensbereich nicht gefunden';
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

function getInitialProjectEditDraft(project?: {
  name: string;
  description?: string;
  lifeAreaId?: string;
  status: ProjectStatus;
  priority: Priority;
  trafficLightStatus: TrafficLightStatus;
  targetDate?: string;
}): ProjectEditDraft {
  return {
    name: project?.name ?? '',
    description: project?.description ?? '',
    lifeAreaId: project?.lifeAreaId ?? '',
    status: project?.status ?? 'planned',
    priority: project?.priority ?? 'medium',
    trafficLightStatus: project?.trafficLightStatus ?? 'green',
    targetDate: project?.targetDate ?? '',
  };
}

function getOptionalValue(value: string): string | undefined {
  const trimmedValue = value.trim();

  return trimmedValue ? trimmedValue : undefined;
}

function createEntityId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getMilestoneDraft(milestone: Milestone): MilestoneDraft {
  return {
    title: milestone.title,
    description: milestone.description ?? '',
    status: milestone.status,
    targetDate: milestone.targetDate ?? '',
  };
}

function getProjectTaskDraft(task: Task): ProjectTaskDraft {
  return {
    title: task.title,
    description: task.description ?? '',
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ?? '',
    plannedDate: task.plannedDate ?? '',
  };
}

export function ProjectDetailPage() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const project = useLifeHQStore(selectProjectById(projectId ?? ''));
  const lifeAreas = useLifeHQStore(selectLifeAreas);
  const milestones = useLifeHQStore(selectMilestonesByProjectId(project?.id ?? ''));
  const tasks = useLifeHQStore(selectTasksByProjectId(project?.id ?? ''));
  const historyEntries = useLifeHQStore(selectHistoryByProjectId(project?.id ?? ''));
  const updateProject = useLifeHQStore((state) => state.updateProject);
  const pauseProject = useLifeHQStore((state) => state.pauseProject);
  const reactivateProject = useLifeHQStore((state) => state.reactivateProject);
  const deleteProject = useLifeHQStore((state) => state.deleteProject);
  const addMilestone = useLifeHQStore((state) => state.addMilestone);
  const updateMilestone = useLifeHQStore((state) => state.updateMilestone);
  const updateMilestoneStatus = useLifeHQStore((state) => state.updateMilestoneStatus);
  const completeMilestone = useLifeHQStore((state) => state.completeMilestone);
  const deleteMilestone = useLifeHQStore((state) => state.deleteMilestone);
  const addTask = useLifeHQStore((state) => state.addTask);
  const updateTask = useLifeHQStore((state) => state.updateTask);
  const updateTaskStatus = useLifeHQStore((state) => state.updateTaskStatus);
  const deleteTask = useLifeHQStore((state) => state.deleteTask);
  const clearTaskPlannedDate = useLifeHQStore((state) => state.clearTaskPlannedDate);
  const clearTaskDueDate = useLifeHQStore((state) => state.clearTaskDueDate);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState<ProjectEditDraft>(() => getInitialProjectEditDraft());
  const [editError, setEditError] = useState<string>();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [pauseDraft, setPauseDraft] = useState<PauseDraft>(defaultPauseDraft);
  const [reactivationDraft, setReactivationDraft] = useState<ReactivationDraft>(() => getInitialReactivationDraft());
  const [isMilestoneFormOpen, setIsMilestoneFormOpen] = useState(false);
  const [milestoneDraft, setMilestoneDraft] = useState<MilestoneDraft>(defaultMilestoneDraft);
  const [milestoneError, setMilestoneError] = useState<string | undefined>();
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | undefined>();
  const [milestoneEditDraft, setMilestoneEditDraft] = useState<MilestoneDraft>(defaultMilestoneDraft);
  const [milestoneEditError, setMilestoneEditError] = useState<string | undefined>();
  const [deleteMilestoneConfirmId, setDeleteMilestoneConfirmId] = useState<string | undefined>();
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [taskDraft, setTaskDraft] = useState<ProjectTaskDraft>(defaultProjectTaskDraft);
  const [taskError, setTaskError] = useState<string | undefined>();
  const [editingTaskId, setEditingTaskId] = useState<string | undefined>();
  const [taskEditDraft, setTaskEditDraft] = useState<ProjectTaskDraft>(defaultProjectTaskDraft);
  const [taskEditError, setTaskEditError] = useState<string | undefined>();
  const [deleteTaskConfirmId, setDeleteTaskConfirmId] = useState<string | undefined>();
  const projectLifeAreaId = project?.lifeAreaId?.trim();
  const lifeArea = projectLifeAreaId ? lifeAreas.find((area) => area.id === projectLifeAreaId) : undefined;
  const lifeAreaDisplayName = lifeArea ? getLifeAreaDisplayName(lifeArea.name) : undefined;
  const lifeAreaDisplayValue = getLifeAreaDisplayValue(projectLifeAreaId, lifeArea?.name);
  const nextRelevantMilestoneLabel = getNextRelevantMilestoneLabel(milestones);
  const openTaskLabel = getOpenTaskLabel(tasks);
  const sortedHistoryEntries = getSortedHistoryEntries(historyEntries);
  const isPausedProject = project?.status === 'paused';
  const canPauseProject = Boolean(project && project.status !== 'paused' && project.status !== 'completed');
  const hasPauseInformation = Boolean(isPausedProject || project?.pausedAt || project?.pauseReason || project?.pauseNote || project?.reviewDate);
  const hasReactivationInformation = Boolean(project?.reactivatedAt || project?.reactivationNote);
  const projectBackLinkTarget = lifeArea ? `/life-areas/${lifeArea.id}` : '/hq';
  const projectBackLinkLabel = lifeAreaDisplayName ? `← Zurück zu ${lifeAreaDisplayName}` : '← Zurück zum HQ';
  const breadcrumbContextLabel = lifeAreaDisplayName ?? 'Projekte ohne Lebensbereich';

  useEffect(() => {
    setPauseDraft(defaultPauseDraft);
    setReactivationDraft(getInitialReactivationDraft(project));
    setEditDraft(getInitialProjectEditDraft(project));
    setEditError(undefined);
    setIsEditOpen(false);
    setIsMilestoneFormOpen(false);
    setMilestoneDraft(defaultMilestoneDraft);
    setMilestoneError(undefined);
    setEditingMilestoneId(undefined);
    setMilestoneEditDraft(defaultMilestoneDraft);
    setMilestoneEditError(undefined);
    setDeleteMilestoneConfirmId(undefined);
    setIsTaskFormOpen(false);
    setTaskDraft(defaultProjectTaskDraft);
    setTaskError(undefined);
    setEditingTaskId(undefined);
    setTaskEditDraft(defaultProjectTaskDraft);
    setTaskEditError(undefined);
    setDeleteTaskConfirmId(undefined);
  }, [project?.id, project?.status]);

  function updateEditDraft(patch: Partial<ProjectEditDraft>) {
    setEditDraft((current) => ({ ...current, ...patch }));
    setEditError(undefined);
  }

  function handleOpenProjectEdit() {
    if (!project) {
      return;
    }

    setEditDraft(getInitialProjectEditDraft(project));
    setEditError(undefined);
    setIsEditOpen((current) => !current);
  }

  function handleCancelProjectEdit() {
    setEditDraft(getInitialProjectEditDraft(project));
    setEditError(undefined);
    setIsEditOpen(false);
  }

  function handleUpdateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!project) {
      return;
    }

    const projectName = editDraft.name.trim();

    if (!projectName) {
      setEditError('Bitte gib einen Projektnamen ein.');
      return;
    }

    updateProject(project.id, {
      name: projectName,
      description: getOptionalValue(editDraft.description),
      lifeAreaId: getOptionalValue(editDraft.lifeAreaId),
      status: editDraft.status,
      priority: editDraft.priority,
      trafficLightStatus: editDraft.trafficLightStatus,
      targetDate: editDraft.targetDate || undefined,
    });

    setEditError(undefined);
    setIsEditOpen(false);
  }

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


  function updateMilestoneDraft(patch: Partial<MilestoneDraft>) {
    setMilestoneDraft((current) => ({ ...current, ...patch }));
    setMilestoneError(undefined);
  }

  function resetMilestoneDraft() {
    setMilestoneDraft(defaultMilestoneDraft);
    setMilestoneError(undefined);
  }

  function handleCreateMilestone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!project) {
      return;
    }

    const title = milestoneDraft.title.trim();

    if (!title) {
      setMilestoneError('Bitte gib einen Meilenstein-Titel ein.');
      return;
    }

    const timestamp = new Date().toISOString();

    addMilestone({
      id: createEntityId('m'),
      projectId: project.id,
      title,
      description: getOptionalValue(milestoneDraft.description),
      status: milestoneDraft.status,
      targetDate: milestoneDraft.targetDate || undefined,
      completedAt: milestoneDraft.status === 'done' ? timestamp : undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    resetMilestoneDraft();
    setIsMilestoneFormOpen(false);
  }

  function openMilestoneEdit(milestone: Milestone) {
    setEditingMilestoneId((current) => (current === milestone.id ? undefined : milestone.id));
    setMilestoneEditDraft(getMilestoneDraft(milestone));
    setMilestoneEditError(undefined);
    setDeleteMilestoneConfirmId(undefined);
  }

  function updateMilestoneEditDraft(patch: Partial<MilestoneDraft>) {
    setMilestoneEditDraft((current) => ({ ...current, ...patch }));
    setMilestoneEditError(undefined);
  }

  function cancelMilestoneEdit() {
    setEditingMilestoneId(undefined);
    setMilestoneEditDraft(defaultMilestoneDraft);
    setMilestoneEditError(undefined);
  }

  function handleUpdateMilestone(event: FormEvent<HTMLFormElement>, milestone: Milestone) {
    event.preventDefault();

    const title = milestoneEditDraft.title.trim();

    if (!title) {
      setMilestoneEditError('Bitte gib einen Meilenstein-Titel ein.');
      return;
    }

    updateMilestone(milestone.id, {
      title,
      description: getOptionalValue(milestoneEditDraft.description),
      targetDate: milestoneEditDraft.targetDate || undefined,
    });

    if (milestoneEditDraft.status !== milestone.status) {
      updateMilestoneStatus(milestone.id, milestoneEditDraft.status);
    }

    cancelMilestoneEdit();
  }

  function handleCompleteMilestone(milestoneId: string) {
    completeMilestone(milestoneId);
    setEditingMilestoneId(undefined);
    setDeleteMilestoneConfirmId(undefined);
  }

  function handleDeleteMilestone(milestoneId: string) {
    deleteMilestone(milestoneId);
    setDeleteMilestoneConfirmId(undefined);
    setEditingMilestoneId(undefined);
  }

  function updateTaskDraft(patch: Partial<ProjectTaskDraft>) {
    setTaskDraft((current) => ({ ...current, ...patch }));
    setTaskError(undefined);
  }

  function updateTaskEditDraft(patch: Partial<ProjectTaskDraft>) {
    setTaskEditDraft((current) => ({ ...current, ...patch }));
    setTaskEditError(undefined);
  }

  function resetTaskDraft() {
    setTaskDraft(defaultProjectTaskDraft);
    setTaskError(undefined);
  }

  function handleCreateProjectTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!project) {
      return;
    }

    const title = taskDraft.title.trim();

    if (!title) {
      setTaskError('Bitte gib einen Aufgabentitel ein.');
      return;
    }

    const timestamp = new Date().toISOString();
    const taskId = createEntityId('t');

    addTask({
      id: taskId,
      title,
      description: getOptionalValue(taskDraft.description),
      status: 'open',
      priority: taskDraft.priority,
      dueDate: taskDraft.dueDate || undefined,
      plannedDate: taskDraft.plannedDate || undefined,
      projectId: project.id,
      lifeAreaId: undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    if (taskDraft.status !== 'open') {
      updateTaskStatus(taskId, taskDraft.status);
    }

    resetTaskDraft();
    setIsTaskFormOpen(false);
  }

  function openTaskEdit(task: Task) {
    setEditingTaskId(task.id);
    setTaskEditDraft(getProjectTaskDraft(task));
    setTaskEditError(undefined);
    setDeleteTaskConfirmId(undefined);
  }

  function cancelTaskEdit() {
    setEditingTaskId(undefined);
    setTaskEditDraft(defaultProjectTaskDraft);
    setTaskEditError(undefined);
  }

  function handleUpdateProjectTask(event: FormEvent<HTMLFormElement>, task: Task) {
    event.preventDefault();

    const title = taskEditDraft.title.trim();

    if (!title) {
      setTaskEditError('Bitte gib einen Aufgabentitel ein.');
      return;
    }

    updateTask(task.id, {
      title,
      description: getOptionalValue(taskEditDraft.description),
      priority: taskEditDraft.priority,
      dueDate: taskEditDraft.dueDate || undefined,
      plannedDate: taskEditDraft.plannedDate || undefined,
      projectId: project?.id ?? task.projectId,
      lifeAreaId: undefined,
    });

    if (taskEditDraft.status !== task.status) {
      updateTaskStatus(task.id, taskEditDraft.status);
    }

    cancelTaskEdit();
  }

  function handleProjectTaskStatusChange(task: Task, status: TaskStatus) {
    updateTaskStatus(task.id, status);
  }

  function handleDeleteProjectTask(taskId: string) {
    deleteTask(taskId);
    setDeleteTaskConfirmId(undefined);

    if (editingTaskId === taskId) {
      cancelTaskEdit();
    }
  }


  function handleDeleteProject() {
    if (!project) {
      return;
    }

    const redirectTarget = projectBackLinkTarget;

    deleteProject(project.id);
    navigate(redirectTarget);
  }

  if (!project) {
    return (
      <div className="space-y-7">
        <Link to="/hq" className="lifehq-button-secondary w-fit">
          ← Zurück zum HQ
        </Link>
        <section className="lifehq-panel p-6">
          <p className="lifehq-label">Projektdetail</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-100">Projekt nicht gefunden</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Dieses Projekt ist im aktuellen HQ-State nicht vorhanden. Kehre zurück ins HQ und wähle ein vorhandenes Projekt aus.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Link to={projectBackLinkTarget} className="lifehq-project-backlink">
          {projectBackLinkLabel}
        </Link>
        <nav aria-label="Projektkontext" className="lifehq-project-breadcrumb">
          <span>HQ</span>
          <span className="text-[#D6AD64]/55" aria-hidden="true">›</span>
          <span>{breadcrumbContextLabel}</span>
          <span className="text-[#D6AD64]/55" aria-hidden="true">›</span>
          <span className="text-[#B8B1A7]">{project.name}</span>
        </nav>
      </div>

      <section className={isPausedProject ? 'lifehq-project-hero lg:grid-cols-[minmax(0,1fr)_20rem]' : 'lifehq-project-hero'}>
        <div className="min-w-0 space-y-5">
          <p className="text-xs uppercase tracking-[0.28em] text-[#D6AD64]/70">Projekt</p>
          <h1 className="break-words font-serif text-4xl font-semibold tracking-tight text-[#F5F1EA] sm:text-5xl lg:text-6xl">{project.name}</h1>
          <p className="max-w-3xl text-base leading-7 text-[#B8B1A7] sm:text-[1.05rem]">
            {project.description ?? 'Für dieses Projekt ist noch keine Beschreibung oder Vision hinterlegt.'}
          </p>
          <button type="button" onClick={handleOpenProjectEdit} className="lifehq-button-secondary w-full sm:w-fit">
            Projekt bearbeiten
          </button>
        </div>

        {isPausedProject && (
          <aside className="lifehq-project-pause-card">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#D6AD64]/35 bg-[#D6AD64]/10 text-[#D6AD64]" aria-hidden="true">Ⅱ</div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#F5F1EA]">Projekt pausiert</p>
                <p className="mt-2 text-sm leading-6 text-[#B8B1A7]">
                  {project.pausedAt ? `Seit ${formatDateDisplay(project.pausedAt)}` : 'Bewusst zurückgestellt, nicht verloren.'}
                </p>
                {project.reviewDate && <p className="mt-1 text-xs text-[#7E776E]">Wiedervorlage: {formatDateDisplay(project.reviewDate)}</p>}
              </div>
            </div>
            <button type="button" onClick={handleReactivateProject} className="lifehq-button-primary mt-5 w-full">
              Projekt reaktivieren
            </button>
          </aside>
        )}
      </section>

      {isEditOpen && (
        <form onSubmit={handleUpdateProject} className="lifehq-project-edit-panel">
          <div className="space-y-2">
            <p className="lifehq-label">Projekt bearbeiten</p>
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-[#F5F1EA]">Grunddaten ruhig nachführen</h2>
            <p className="max-w-2xl text-sm leading-6 text-[#B8B1A7]">
              Passe Name, Kontext und Statuswerte an, ohne den Projektfluss zu verlassen.
            </p>
          </div>

          <div className="lifehq-project-edit-grid">
            <label className="space-y-2 text-sm text-[#B8B1A7] xl:col-span-2">
              <span className="lifehq-label">Projektname</span>
              <input
                type="text"
                value={editDraft.name}
                onChange={(event) => updateEditDraft({ name: event.target.value })}
                className="lifehq-project-form-control"
                required
              />
            </label>

            <label className="space-y-2 text-sm text-[#B8B1A7]">
              <span className="lifehq-label">Lebensbereich</span>
              <select
                value={editDraft.lifeAreaId}
                onChange={(event) => updateEditDraft({ lifeAreaId: event.target.value })}
                className="lifehq-project-form-control"
              >
                <option value="">Ohne Lebensbereich</option>
                {lifeAreas.map((area) => (
                  <option key={area.id} value={area.id}>{getLifeAreaDisplayName(area.name)}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm text-[#B8B1A7] md:col-span-2 xl:col-span-3">
              <span className="lifehq-label">Beschreibung</span>
              <textarea
                value={editDraft.description}
                onChange={(event) => updateEditDraft({ description: event.target.value })}
                className="lifehq-project-form-control min-h-24 resize-y"
                rows={3}
              />
            </label>

            <label className="space-y-2 text-sm text-[#B8B1A7]">
              <span className="lifehq-label">Status</span>
              <select
                value={editDraft.status}
                onChange={(event) => updateEditDraft({ status: event.target.value as ProjectStatus })}
                className="lifehq-project-form-control"
              >
                {projectStatusOptions.map((status) => (
                  <option key={status} value={status}>{projectStatusLabels[status]}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm text-[#B8B1A7]">
              <span className="lifehq-label">Priorität</span>
              <select
                value={editDraft.priority}
                onChange={(event) => updateEditDraft({ priority: event.target.value as Priority })}
                className="lifehq-project-form-control"
              >
                {priorityOptions.map((priority) => (
                  <option key={priority} value={priority}>{priorityLabels[priority]}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm text-[#B8B1A7]">
              <span className="lifehq-label">Ampelstatus</span>
              <select
                value={editDraft.trafficLightStatus}
                onChange={(event) => updateEditDraft({ trafficLightStatus: event.target.value as TrafficLightStatus })}
                className="lifehq-project-form-control"
              >
                {trafficLightOptions.map((status) => (
                  <option key={status} value={status}>{trafficLightLabels[status]}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm text-[#B8B1A7]">
              <span className="lifehq-label">Zieltermin</span>
              <input
                type="date"
                value={editDraft.targetDate}
                onChange={(event) => updateEditDraft({ targetDate: event.target.value })}
                className="lifehq-project-form-control"
              />
            </label>
          </div>

          <div className="lifehq-project-edit-actions">
            <p className={editError ? 'text-sm leading-6 text-amber-200/90' : 'text-sm leading-6 text-[#7E776E]'}>
              {editError ?? 'Speichern aktualisiert die Projektansicht direkt, ohne die Seite zu wechseln.'}
            </p>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <button type="button" onClick={handleCancelProjectEdit} className="lifehq-button-secondary">
                Abbrechen
              </button>
              <button type="submit" className="lifehq-button-primary">
                Speichern
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="lifehq-project-status-grid">
        <ProjectStatusCard label="Lebensbereich" value={lifeAreaDisplayValue} icon="◎" />
        <ProjectStatusCard label="Status" value={projectStatusLabels[project.status]} icon="◷" />
        <ProjectStatusCard label="Priorität" value={priorityLabels[project.priority]} icon="✦" />
        <ProjectStatusCard label="Ampelstatus" value={trafficLightLabels[project.trafficLightStatus]} icon="●">
          <span className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ring-4 ${trafficLightStyles[project.trafficLightStatus]}`} />
            <span>{trafficLightLabels[project.trafficLightStatus]}</span>
          </span>
        </ProjectStatusCard>
        <ProjectStatusCard label="Zieltermin" value={formatDateDisplay(project.targetDate, 'Kein Zieltermin')} icon="⌁" />
        <ProjectStatusCard label="Offene Aufgaben" value={openTaskLabel} icon="□" />
        <ProjectStatusCard label="Nächster Meilenstein" value={nextRelevantMilestoneLabel} icon="◇" />
      </div>

      <ProjectSection title="Meilensteine" description="Größere Fortschrittspunkte dieses Projekts, ruhig und strategisch eingeordnet.">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-[#7E776E]">Erfasse, bearbeite und schließe die wichtigsten Projektetappen direkt hier.</p>
          <button type="button" onClick={() => { resetMilestoneDraft(); setIsMilestoneFormOpen((current) => !current); }} className="lifehq-button-secondary w-fit">
            Meilenstein hinzufügen
          </button>
        </div>

        {isMilestoneFormOpen && (
          <form onSubmit={handleCreateMilestone} className="lifehq-project-edit-panel mb-5">
            <div className="space-y-2">
              <p className="lifehq-label">Neuer Meilenstein</p>
              <h4 className="text-base font-semibold text-[#F5F1EA]">Projektetappe erfassen</h4>
            </div>
            <div className="lifehq-project-edit-grid">
              <label className="space-y-2 text-sm text-[#B8B1A7] xl:col-span-2">
                <span className="lifehq-label">Titel</span>
                <input value={milestoneDraft.title} onChange={(event) => updateMilestoneDraft({ title: event.target.value })} className="lifehq-project-form-control" />
              </label>
              <label className="space-y-2 text-sm text-[#B8B1A7]">
                <span className="lifehq-label">Status</span>
                <select value={milestoneDraft.status} onChange={(event) => updateMilestoneDraft({ status: event.target.value as MilestoneStatus })} className="lifehq-project-form-control">
                  {milestoneStatusOptions.map((status) => <option key={status} value={status}>{milestoneStatusLabels[status]}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-sm text-[#B8B1A7] xl:col-span-2">
                <span className="lifehq-label">Beschreibung</span>
                <textarea value={milestoneDraft.description} onChange={(event) => updateMilestoneDraft({ description: event.target.value })} rows={3} className="lifehq-project-form-control" />
              </label>
              <label className="space-y-2 text-sm text-[#B8B1A7]">
                <span className="lifehq-label">Zieltermin</span>
                <input type="date" value={milestoneDraft.targetDate} onChange={(event) => updateMilestoneDraft({ targetDate: event.target.value })} className="lifehq-project-form-control" />
              </label>
            </div>
            <div className="lifehq-project-edit-actions">
              {milestoneError ? <p className="text-sm leading-6 text-amber-200/90">{milestoneError}</p> : <p className="text-sm leading-6 text-[#7E776E]">Der Meilenstein wird automatisch diesem Projekt zugeordnet.</p>}
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => { resetMilestoneDraft(); setIsMilestoneFormOpen(false); }} className="lifehq-button-secondary">Abbrechen</button>
                <button type="submit" className="lifehq-button-primary">Speichern</button>
              </div>
            </div>
          </form>
        )}

        {milestones.length === 0 ? (
          <p className="lifehq-empty-state">Noch keine Meilensteine vorhanden.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {milestones.map((milestone) => {
              const isEditingMilestone = editingMilestoneId === milestone.id;
              const isDeletingMilestone = deleteMilestoneConfirmId === milestone.id;

              return (
                <article key={milestone.id} className={`lifehq-project-milestone-card ${milestone.status === 'done' ? 'opacity-70' : ''}`}>
                  <div className="flex items-start gap-4">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm ${getMilestoneMarkerClass(milestone.status)}`} aria-hidden="true">
                      {milestone.status === 'done' ? '✓' : milestone.status === 'in_progress' ? '•' : '○'}
                    </span>
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="space-y-2">
                        <h4 className="text-base font-semibold tracking-tight text-[#F5F1EA]">{milestone.title}</h4>
                        {milestone.description && <p className="text-sm leading-6 text-[#B8B1A7]">{milestone.description}</p>}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-[#B8B1A7]">
                        <span className="lifehq-badge">{milestoneStatusLabels[milestone.status]}</span>
                        <span className="lifehq-badge">Zieltermin: {formatDateDisplay(milestone.targetDate, 'Kein Zieltermin')}</span>
                        {milestone.completedAt && <span className="lifehq-badge">Erledigt: {formatDateDisplay(milestone.completedAt)}</span>}
                      </div>
                      <div className="flex flex-wrap gap-2 border-t border-white/[0.07] pt-3 text-xs">
                        {milestone.status !== 'done' && (
                          <button type="button" onClick={() => handleCompleteMilestone(milestone.id)} className="lifehq-task-action-button lifehq-task-action-button-gold">
                            Erledigen
                          </button>
                        )}
                        <button type="button" onClick={() => openMilestoneEdit(milestone)} className="lifehq-task-action-button">
                          Bearbeiten
                        </button>
                        <button type="button" onClick={() => { setDeleteMilestoneConfirmId((current) => current === milestone.id ? undefined : milestone.id); setEditingMilestoneId(undefined); }} className="lifehq-task-action-button">
                          Löschen
                        </button>
                      </div>

                      {isDeletingMilestone && (
                        <div className="lifehq-danger-zone">
                          <p className="text-sm leading-6 text-[#B8B1A7]">Diesen Meilenstein wirklich löschen?</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button type="button" onClick={() => setDeleteMilestoneConfirmId(undefined)} className="lifehq-button-secondary">Abbrechen</button>
                            <button type="button" onClick={() => handleDeleteMilestone(milestone.id)} className="lifehq-button-primary">Endgültig löschen</button>
                          </div>
                        </div>
                      )}

                      {isEditingMilestone && (
                        <form onSubmit={(event) => handleUpdateMilestone(event, milestone)} className="lifehq-project-edit-panel p-4">
                          <div className="grid gap-3">
                            <label className="space-y-2 text-sm text-[#B8B1A7]">
                              <span className="lifehq-label">Titel</span>
                              <input value={milestoneEditDraft.title} onChange={(event) => updateMilestoneEditDraft({ title: event.target.value })} className="lifehq-project-form-control" />
                            </label>
                            <label className="space-y-2 text-sm text-[#B8B1A7]">
                              <span className="lifehq-label">Beschreibung</span>
                              <textarea value={milestoneEditDraft.description} onChange={(event) => updateMilestoneEditDraft({ description: event.target.value })} rows={3} className="lifehq-project-form-control" />
                            </label>
                            <label className="space-y-2 text-sm text-[#B8B1A7]">
                              <span className="lifehq-label">Status</span>
                              <select value={milestoneEditDraft.status} onChange={(event) => updateMilestoneEditDraft({ status: event.target.value as MilestoneStatus })} className="lifehq-project-form-control">
                                {milestoneStatusOptions.map((status) => <option key={status} value={status}>{milestoneStatusLabels[status]}</option>)}
                              </select>
                            </label>
                            <label className="space-y-2 text-sm text-[#B8B1A7]">
                              <span className="lifehq-label">Zieltermin</span>
                              <input type="date" value={milestoneEditDraft.targetDate} onChange={(event) => updateMilestoneEditDraft({ targetDate: event.target.value })} className="lifehq-project-form-control" />
                            </label>
                          </div>
                          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            {milestoneEditError ? <p className="text-sm text-amber-100">{milestoneEditError}</p> : <p className="text-sm text-[#7E776E]">Änderungen bleiben im Projekt gespeichert.</p>}
                            <div className="flex flex-wrap gap-2">
                              <button type="button" onClick={cancelMilestoneEdit} className="lifehq-button-secondary">Abbrechen</button>
                              <button type="submit" className="lifehq-button-primary">Speichern</button>
                            </div>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </ProjectSection>

      <ProjectSection title="Projektaufgaben" description="Operative Bezugspunkte dieses Projekts als ruhige Ausführungszeilen.">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-[#7E776E]">Neue Aufgaben werden automatisch diesem Projekt zugeordnet.</p>
          <button
            type="button"
            onClick={() => {
              setIsTaskFormOpen((current) => !current);
              setEditingTaskId(undefined);
              setDeleteTaskConfirmId(undefined);
              setTaskError(undefined);
            }}
            className="lifehq-button-secondary w-fit"
          >
            Neue Aufgabe
          </button>
        </div>

        {isTaskFormOpen && (
          <form onSubmit={handleCreateProjectTask} className="lifehq-project-edit-panel mb-5 p-4">
            <div className="lifehq-project-edit-grid">
              <label className="space-y-2 text-sm text-[#B8B1A7] xl:col-span-2">
                <span className="lifehq-label">Titel</span>
                <input value={taskDraft.title} onChange={(event) => updateTaskDraft({ title: event.target.value })} className="lifehq-project-form-control" />
              </label>
              <label className="space-y-2 text-sm text-[#B8B1A7]">
                <span className="lifehq-label">Status</span>
                <select value={taskDraft.status} onChange={(event) => updateTaskDraft({ status: event.target.value as TaskStatus })} className="lifehq-project-form-control">
                  {taskStatusOptions.map((status) => <option key={status} value={status}>{taskStatusLabels[status]}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-sm text-[#B8B1A7] xl:col-span-2">
                <span className="lifehq-label">Beschreibung</span>
                <textarea value={taskDraft.description} onChange={(event) => updateTaskDraft({ description: event.target.value })} rows={3} className="lifehq-project-form-control" />
              </label>
              <label className="space-y-2 text-sm text-[#B8B1A7]">
                <span className="lifehq-label">Priorität</span>
                <select value={taskDraft.priority} onChange={(event) => updateTaskDraft({ priority: event.target.value as Priority })} className="lifehq-project-form-control">
                  {priorityOptions.map((priority) => <option key={priority} value={priority}>{priorityLabels[priority]}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-sm text-[#B8B1A7]">
                <span className="lifehq-label">Fälligkeit</span>
                <input type="date" value={taskDraft.dueDate} onChange={(event) => updateTaskDraft({ dueDate: event.target.value })} className="lifehq-project-form-control" />
              </label>
              <label className="space-y-2 text-sm text-[#B8B1A7]">
                <span className="lifehq-label">Geplantes Datum</span>
                <input type="date" value={taskDraft.plannedDate} onChange={(event) => updateTaskDraft({ plannedDate: event.target.value })} className="lifehq-project-form-control" />
              </label>
            </div>
            <div className="lifehq-project-edit-actions">
              {taskError ? <p className="text-sm leading-6 text-amber-200/90">{taskError}</p> : <p className="text-sm leading-6 text-[#7E776E]">Die Aufgabe erscheint auch im globalen Aufgabenbereich.</p>}
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => { resetTaskDraft(); setIsTaskFormOpen(false); }} className="lifehq-button-secondary">Abbrechen</button>
                <button type="submit" className="lifehq-button-primary">Speichern</button>
              </div>
            </div>
          </form>
        )}

        {tasks.length === 0 ? (
          <p className="lifehq-empty-state">Noch keine Aufgaben für dieses Projekt vorhanden.</p>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const isEditingTask = editingTaskId === task.id;
              const isDeletingTask = deleteTaskConfirmId === task.id;

              return (
                <article key={task.id} className={`lifehq-project-task-row ${task.status === 'done' ? 'opacity-70' : ''}`}>
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${getTaskMarkerClass(task.status)}`} aria-hidden="true">
                      {task.status === 'done' && <span className="h-1.5 w-1.5 rounded-full bg-[#7E776E]" />}
                      {task.status === 'in_progress' && <span className="h-1.5 w-1.5 rounded-full bg-[#D6AD64]" />}
                    </span>
                    <div className="min-w-0 space-y-2">
                      <h4 className="break-words text-sm font-semibold leading-6 text-[#F5F1EA]">{task.title}</h4>
                      {task.description && <p className="break-words text-sm leading-6 text-[#7E776E]">{task.description}</p>}
                    </div>
                  </div>
                  <div className="grid w-full gap-2 text-xs text-[#B8B1A7] sm:grid-cols-2 lg:w-auto lg:min-w-[22rem] lg:grid-cols-4 lg:text-right">
                    <span>Status: {taskStatusLabels[task.status]}</span>
                    <span>Priorität: {priorityLabels[task.priority]}</span>
                    <span>Fällig: {formatDateDisplay(task.dueDate, 'Keine Fälligkeit')}</span>
                    <span>Geplant: {formatDateDisplay(task.plannedDate, 'Nicht geplant')}</span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-white/[0.07] pt-3 text-xs">
                    {task.status !== 'open' && <button type="button" onClick={() => handleProjectTaskStatusChange(task, 'open')} className="lifehq-task-action-button">Wieder öffnen</button>}
                    {task.status !== 'in_progress' && <button type="button" onClick={() => handleProjectTaskStatusChange(task, 'in_progress')} className="lifehq-task-action-button lifehq-task-action-button-gold">In Arbeit setzen</button>}
                    {task.status !== 'done' && <button type="button" onClick={() => handleProjectTaskStatusChange(task, 'done')} className="lifehq-task-action-button">Erledigen</button>}
                    <button type="button" onClick={() => openTaskEdit(task)} className="lifehq-task-action-button">Bearbeiten</button>
                    {task.plannedDate && <button type="button" onClick={() => clearTaskPlannedDate(task.id)} className="lifehq-task-action-button">Planung entfernen</button>}
                    {task.dueDate && <button type="button" onClick={() => clearTaskDueDate(task.id)} className="lifehq-task-action-button">Fälligkeit entfernen</button>}
                    <button type="button" onClick={() => { setDeleteTaskConfirmId((current) => current === task.id ? undefined : task.id); setEditingTaskId(undefined); }} className="lifehq-task-action-button">Löschen</button>
                  </div>

                  {isDeletingTask && (
                    <div className="lifehq-danger-zone mt-4">
                      <p className="text-sm leading-6 text-[#B8B1A7]">Diese Aufgabe wirklich löschen?</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" onClick={() => setDeleteTaskConfirmId(undefined)} className="lifehq-button-secondary">Abbrechen</button>
                        <button type="button" onClick={() => handleDeleteProjectTask(task.id)} className="lifehq-button-primary">Endgültig löschen</button>
                      </div>
                    </div>
                  )}

                  {isEditingTask && (
                    <form onSubmit={(event) => handleUpdateProjectTask(event, task)} className="lifehq-project-edit-panel mt-4 p-4">
                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="space-y-2 text-sm text-[#B8B1A7]">
                          <span className="lifehq-label">Titel</span>
                          <input value={taskEditDraft.title} onChange={(event) => updateTaskEditDraft({ title: event.target.value })} className="lifehq-project-form-control" />
                        </label>
                        <label className="space-y-2 text-sm text-[#B8B1A7]">
                          <span className="lifehq-label">Status</span>
                          <select value={taskEditDraft.status} onChange={(event) => updateTaskEditDraft({ status: event.target.value as TaskStatus })} className="lifehq-project-form-control">
                            {taskStatusOptions.map((status) => <option key={status} value={status}>{taskStatusLabels[status]}</option>)}
                          </select>
                        </label>
                        <label className="space-y-2 text-sm text-[#B8B1A7] md:col-span-2">
                          <span className="lifehq-label">Beschreibung</span>
                          <textarea value={taskEditDraft.description} onChange={(event) => updateTaskEditDraft({ description: event.target.value })} rows={3} className="lifehq-project-form-control" />
                        </label>
                        <label className="space-y-2 text-sm text-[#B8B1A7]">
                          <span className="lifehq-label">Priorität</span>
                          <select value={taskEditDraft.priority} onChange={(event) => updateTaskEditDraft({ priority: event.target.value as Priority })} className="lifehq-project-form-control">
                            {priorityOptions.map((priority) => <option key={priority} value={priority}>{priorityLabels[priority]}</option>)}
                          </select>
                        </label>
                        <label className="space-y-2 text-sm text-[#B8B1A7]">
                          <span className="lifehq-label">Fälligkeit</span>
                          <input type="date" value={taskEditDraft.dueDate} onChange={(event) => updateTaskEditDraft({ dueDate: event.target.value })} className="lifehq-project-form-control" />
                        </label>
                        <label className="space-y-2 text-sm text-[#B8B1A7]">
                          <span className="lifehq-label">Geplantes Datum</span>
                          <input type="date" value={taskEditDraft.plannedDate} onChange={(event) => updateTaskEditDraft({ plannedDate: event.target.value })} className="lifehq-project-form-control" />
                        </label>
                      </div>
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        {taskEditError ? <p className="text-sm text-amber-100">{taskEditError}</p> : <p className="text-sm text-[#7E776E]">Änderungen bleiben im Projekt und im Aufgabenbereich sichtbar.</p>}
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={cancelTaskEdit} className="lifehq-button-secondary">Abbrechen</button>
                          <button type="submit" className="lifehq-button-primary">Speichern</button>
                        </div>
                      </div>
                    </form>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </ProjectSection>

      <ProjectSection title="Projektverlauf" description="Sekundärer Verlauf wichtiger Projektbewegungen." secondary>
        {sortedHistoryEntries.length === 0 ? (
          <p className="lifehq-empty-state">Noch keine Verlaufseinträge vorhanden.</p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {sortedHistoryEntries.map((entry) => (
              <article key={entry.id} className="lifehq-project-history-entry">
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#D6AD64]/75 shadow-[0_0_14px_rgba(214,173,100,0.25)]" aria-hidden="true" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#B8B1A7]">{historyTypeLabels[entry.type]}</p>
                      <p className="text-xs text-[#7E776E] sm:text-right">{formatDateDisplay(entry.date, 'Kein Datum')}</p>
                    </div>
                    <p className="text-sm leading-6 text-[#B8B1A7]">{entry.description}</p>
                    {(entry.taskId || entry.milestoneId || entry.oldValue || entry.newValue || entry.note) && (
                      <div className="flex flex-wrap gap-2 text-xs text-[#7E776E]">
                        {entry.taskId && <span className="lifehq-badge">Aufgabe: {entry.taskId}</span>}
                        {entry.milestoneId && <span className="lifehq-badge">Meilenstein: {entry.milestoneId}</span>}
                        {entry.oldValue && <span className="lifehq-badge">Vorher: {formatHistoryValue(entry.oldValue)}</span>}
                        {entry.newValue && <span className="lifehq-badge">Neu: {formatHistoryValue(entry.newValue)}</span>}
                        {entry.note && <span className="lifehq-badge">Notiz: {entry.note}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </ProjectSection>

      <ProjectSection title="Projekt löschen" description="Diesen V1-Verwaltungsschritt nur ausführen, wenn das Projekt wirklich entfernt werden soll." secondary>
        <div className="lifehq-danger-zone">
          <p className="text-sm leading-6 text-[#B8B1A7]">
            Projekt löschen entfernt dieses Projekt inklusive zugehöriger Meilensteine, Projektaufgaben und Verlaufseinträge.
          </p>
          {isDeleteConfirmOpen ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm font-medium text-[#F5F1EA]">Dieses Projekt wirklich löschen? Zugehörige Meilensteine, Projektaufgaben und Verlaufseinträge werden ebenfalls entfernt.</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setIsDeleteConfirmOpen(false)} className="lifehq-button-secondary">Abbrechen</button>
                <button type="button" onClick={handleDeleteProject} className="lifehq-button-primary">Endgültig löschen</button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setIsDeleteConfirmOpen(true)} className="lifehq-button-secondary mt-4">Projekt löschen</button>
          )}
        </div>
      </ProjectSection>


      {(canPauseProject || hasPauseInformation || hasReactivationInformation) && (
        <ProjectSection title="Fokussteuerung" description="Bestehende Pause- und Reaktivierungsinformationen bleiben funktional erhalten." secondary>
          <div className="space-y-4">
            {canPauseProject && (
              <div className="lifehq-project-action-panel">
                <div className="max-w-2xl">
                  <p className="lifehq-label">Fokusentscheidung</p>
                  <h4 className="mt-2 text-base font-semibold text-[#F5F1EA]">Projekt pausieren</h4>
                  <p className="mt-2 text-sm leading-6 text-[#B8B1A7]">
                    Pausieren nimmt dieses Projekt bewusst aus dem aktiven Fokus. Es bleibt gespeichert und kann später wieder aufgenommen werden.
                  </p>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
                  <label className="space-y-2 text-sm text-[#B8B1A7]">
                    <span className="lifehq-label">Pausierungsgrund</span>
                    <input
                      value={pauseDraft.reason}
                      onChange={(event) => updatePauseDraft({ reason: event.target.value })}
                      placeholder="Warum ruht dieses Projekt gerade?"
                      className="lifehq-project-form-control"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-[#B8B1A7]">
                    <span className="lifehq-label">Wiedervorlage</span>
                    <input
                      type="date"
                      value={pauseDraft.reviewDate}
                      onChange={(event) => updatePauseDraft({ reviewDate: event.target.value })}
                      className="lifehq-project-form-control"
                    />
                  </label>
                  <button type="button" onClick={handlePauseProject} className="lifehq-button-secondary w-fit lg:mb-1">
                    Projekt pausieren
                  </button>
                </div>

                <label className="mt-4 block space-y-2 text-sm text-[#B8B1A7]">
                  <span className="lifehq-label">Pausierungsnotiz</span>
                  <textarea
                    value={pauseDraft.note}
                    onChange={(event) => updatePauseDraft({ note: event.target.value })}
                    placeholder="Optionale Notiz für den späteren Wiedereinstieg."
                    rows={3}
                    className="lifehq-project-form-control"
                  />
                </label>
              </div>
            )}

            {hasPauseInformation && (
              <div className="lifehq-project-action-panel">
                <div className="max-w-2xl">
                  <p className="lifehq-label">Pausiertes Projekt</p>
                  <h4 className="mt-2 text-base font-semibold text-[#F5F1EA]">Pausierungsinformationen</h4>
                  <p className="mt-2 text-sm leading-6 text-[#B8B1A7]">
                    Dieses Projekt ist bewusst pausiert oder wurde bewusst pausiert. Es bleibt gespeichert und kann später wieder aufgenommen werden.
                  </p>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <ProjectStatusCard label="Pausierungsdatum" value={formatDateDisplay(project.pausedAt, 'Kein Pausierungsdatum')} icon="Ⅱ" />
                  <ProjectStatusCard label="Pausierungsgrund" value={project.pauseReason ?? 'Kein Pausierungsgrund'} icon="✦" />
                  <ProjectStatusCard label="Pausierungsnotiz" value={project.pauseNote ?? 'Keine Pausierungsnotiz'} icon="◇" />
                  <ProjectStatusCard label="Wiedervorlage" value={formatDateDisplay(project.reviewDate, 'Keine Wiedervorlage')} icon="⌁" />
                </div>

                {isPausedProject && (
                  <div className="lifehq-project-action-panel mt-5 border-[#D6AD64]/20 bg-black/25">
                    <div className="max-w-2xl">
                      <p className="lifehq-label">Zurück in den Fokus</p>
                      <h4 className="mt-2 text-base font-semibold text-[#F5F1EA]">Projekt reaktivieren</h4>
                      <p className="mt-2 text-sm leading-6 text-[#B8B1A7]">
                        Reaktivieren bringt dieses Projekt zurück in den geplanten oder aktiven Arbeitszustand.
                      </p>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <label className="space-y-2 text-sm text-[#B8B1A7]">
                        <span className="lifehq-label">Neuer Status</span>
                        <select
                          value={reactivationDraft.status}
                          onChange={(event) => updateReactivationDraft({ status: event.target.value as ReactivationStatus })}
                          className="lifehq-project-form-control"
                        >
                          {reactivationStatusOptions.map((status) => (
                            <option key={status} value={status}>{projectStatusLabels[status]}</option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-2 text-sm text-[#B8B1A7]">
                        <span className="lifehq-label">Priorität</span>
                        <select
                          value={reactivationDraft.priority}
                          onChange={(event) => updateReactivationDraft({ priority: event.target.value as Priority })}
                          className="lifehq-project-form-control"
                        >
                          {priorityOptions.map((priority) => (
                            <option key={priority} value={priority}>{priorityLabels[priority]}</option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-2 text-sm text-[#B8B1A7]">
                        <span className="lifehq-label">Ampelstatus</span>
                        <select
                          value={reactivationDraft.trafficLightStatus}
                          onChange={(event) => updateReactivationDraft({ trafficLightStatus: event.target.value as TrafficLightStatus })}
                          className="lifehq-project-form-control"
                        >
                          {trafficLightOptions.map((status) => (
                            <option key={status} value={status}>{trafficLightLabels[status]}</option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-2 text-sm text-[#B8B1A7]">
                        <span className="lifehq-label">Zieltermin</span>
                        <input
                          type="date"
                          value={reactivationDraft.targetDate}
                          onChange={(event) => updateReactivationDraft({ targetDate: event.target.value })}
                          className="lifehq-project-form-control"
                        />
                      </label>
                      <label className="space-y-2 text-sm text-[#B8B1A7] md:col-span-2">
                        <span className="lifehq-label">Beschreibung</span>
                        <textarea
                          value={reactivationDraft.description}
                          onChange={(event) => updateReactivationDraft({ description: event.target.value })}
                          rows={3}
                          className="lifehq-project-form-control"
                        />
                      </label>
                      <label className="space-y-2 text-sm text-[#B8B1A7] xl:col-span-3">
                        <span className="lifehq-label">Reaktivierungsnotiz</span>
                        <textarea
                          value={reactivationDraft.note}
                          onChange={(event) => updateReactivationDraft({ note: event.target.value })}
                          placeholder="Optionale Notiz für den Neustart."
                          rows={3}
                          className="lifehq-project-form-control"
                        />
                      </label>
                    </div>

                    <div className="mt-5 flex justify-end">
                      <button type="button" onClick={handleReactivateProject} className="lifehq-button-primary">
                        Projekt reaktivieren
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {hasReactivationInformation && (
              <div className="lifehq-project-action-panel">
                <div className="max-w-2xl">
                  <p className="lifehq-label">Projektrückkehr</p>
                  <h4 className="mt-2 text-base font-semibold text-[#F5F1EA]">Reaktivierungsinformationen</h4>
                  <p className="mt-2 text-sm leading-6 text-[#B8B1A7]">
                    Diese Informationen halten fest, wann das Projekt wieder bewusst aufgenommen wurde.
                  </p>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <ProjectStatusCard label="Reaktivierungsdatum" value={formatDateDisplay(project.reactivatedAt, 'Kein Reaktivierungsdatum')} icon="↺" />
                  <ProjectStatusCard label="Reaktivierungsnotiz" value={project.reactivationNote ?? 'Keine Reaktivierungsnotiz'} icon="✦" />
                </div>
              </div>
            )}
          </div>
        </ProjectSection>
      )}
    </div>
  );
}
