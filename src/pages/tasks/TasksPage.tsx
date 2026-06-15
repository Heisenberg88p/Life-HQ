import { useEffect, useMemo, useState } from 'react';
import { priorityLabels, taskStatusLabels as statusLabels, taskStatusOptions } from '../../constants/displayLabels';
import { getNextWeekDays, getWeekDays, isSameDay } from '../../logic/dateLogic';
import { formatDateDisplay } from '../../utils/dateFormat';
import type { FormEvent } from 'react';
import type { Priority, TaskStatus } from '../../models/common';
import type { LifeArea } from '../../models/lifeArea';
import type { Project } from '../../models/project';
import type { Task } from '../../models/task';
import {
  selectLifeAreas,
  selectProjects,
  selectTasks,
  useLifeHQStore,
} from '../../store';
import {
  getDoneTasks,
  getOpenTasks,
  getOverdueTasks,
  getTasksForCurrentWeek,
  getTasksForLater,
  getTasksForNextWeek,
  getTasksForToday,
  isTaskOverdue,
} from '../../logic/taskLogic';

type TaskView = 'today' | 'week' | 'nextWeek' | 'later' | 'overdue' | 'open' | 'done';

type TaskDraft = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  projectId: string;
  lifeAreaId: string;
  dueDate: string;
  plannedDate: string;
};

type TaskEditDraft = TaskDraft;

type TaskDateDraft = {
  plannedDate: string;
  dueDate: string;
};

const taskViews: Array<{ id: TaskView; label: string; description: string }> = [
  { id: 'today', label: 'Heute', description: 'Geplante Schritte für den aktuellen Tag.' },
  { id: 'week', label: 'Diese Woche', description: 'Aufgaben, die in dieser Woche eingeordnet sind.' },
  { id: 'nextWeek', label: 'Nächste Woche', description: 'Geplante Aufgaben der kommenden Woche.' },
  { id: 'later', label: 'Später', description: 'Offene Aufgaben nach Ende der nächsten Woche.' },
  { id: 'overdue', label: 'Überfällig', description: 'Aufgaben, die ruhig geprüft und neu eingeordnet werden sollten.' },
  { id: 'open', label: 'Offene Aufgaben', description: 'Alle Aufgaben, die noch nicht erledigt sind.' },
  { id: 'done', label: 'Erledigte Aufgaben', description: 'Abgeschlossene Schritte zur Nachverfolgung.' },
];

const emptyStateMessages: Record<TaskView, string> = {
  today: 'Für heute sind keine Aufgaben geplant.',
  week: 'Für diese Woche sind keine Aufgaben geplant.',
  nextWeek: 'Für nächste Woche sind keine Aufgaben geplant.',
  later: 'Keine später geplanten Aufgaben vorhanden.',
  overdue: 'Keine überfälligen Aufgaben.',
  open: 'Keine offenen Aufgaben vorhanden.',
  done: 'Noch keine erledigten Aufgaben vorhanden.',
};

const prioritySortOrder: Record<Priority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function compareTasksByPlanningWeight(taskA: Task, taskB: Task): number {
  if (taskA.status === 'done' && taskB.status !== 'done') {
    return 1;
  }

  if (taskA.status !== 'done' && taskB.status === 'done') {
    return -1;
  }

  const priorityDifference = prioritySortOrder[taskA.priority] - prioritySortOrder[taskB.priority];

  if (priorityDifference !== 0) {
    return priorityDifference;
  }

  return taskA.title.localeCompare(taskB.title);
}

function sortTasksForPlanning(tasks: Task[]): Task[] {
  return [...tasks].sort(compareTasksByPlanningWeight);
}

function sortOverdueTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((taskA, taskB) => {
    const dueDateDifference = (taskA.dueDate ?? '').localeCompare(taskB.dueDate ?? '');

    if (dueDateDifference !== 0) {
      return dueDateDifference;
    }

    return compareTasksByPlanningWeight(taskA, taskB);
  });
}

const statusStyles: Record<TaskStatus, string> = {
  open: 'border-white/10 bg-white/[0.025] text-[#B8B1A7]',
  in_progress: 'border-[#D6AD64]/25 bg-[#D6AD64]/10 text-[#F5F1EA]',
  done: 'border-white/10 bg-white/[0.018] text-[#7E776E]',
};

interface TaskContextInfo {
  label: string;
  detail?: string;
  tone: 'project' | 'lifeArea' | 'unassigned';
}

const contextStyles: Record<TaskContextInfo['tone'], string> = {
  project: 'border-[#D6AD64]/20 bg-[#D6AD64]/10 text-[#F5F1EA]',
  lifeArea: 'border-white/10 bg-white/[0.025] text-[#B8B1A7]',
  unassigned: 'border-white/[0.08] bg-black/20 text-[#7E776E]',
};

const defaultTaskDraft: TaskDraft = {
  title: '',
  description: '',
  status: 'open',
  priority: 'medium',
  projectId: '',
  lifeAreaId: '',
  dueDate: '',
  plannedDate: '',
};

function getTaskDateDraft(task: Task): TaskDateDraft {
  return {
    plannedDate: task.plannedDate ?? '',
    dueDate: task.dueDate ?? '',
  };
}

function getTaskEditDraft(task: Task): TaskEditDraft {
  return {
    title: task.title,
    description: task.description ?? '',
    status: task.status,
    priority: task.priority,
    projectId: task.projectId ?? '',
    lifeAreaId: task.lifeAreaId ?? '',
    dueDate: task.dueDate ?? '',
    plannedDate: task.plannedDate ?? '',
  };
}

function getOptionalTaskText(value: string): string | undefined {
  const trimmedValue = value.trim();

  return trimmedValue ? trimmedValue : undefined;
}

function createTaskId(): string {
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getUniqueTasks(tasks: Task[]): Task[] {
  const uniqueTasks = new Map<string, Task>();

  tasks.forEach((task) => {
    uniqueTasks.set(task.id, task);
  });

  return Array.from(uniqueTasks.values());
}

function getUnplannedOpenTasks(tasks: Task[]): Task[] {
  return tasks.filter((task) => !task.plannedDate && task.status !== 'done');
}

function getWeekViewTasks(tasks: Task[], plannedTasks: Task[]): Task[] {
  return getUniqueTasks([...plannedTasks, ...getUnplannedOpenTasks(tasks), ...getOverdueTasks(tasks)]);
}

function getVisibleTasks(tasks: Task[], activeView: TaskView): Task[] {
  switch (activeView) {
    case 'today':
      return sortTasksForPlanning(getTasksForToday(tasks));
    case 'week':
      return sortTasksForPlanning(getWeekViewTasks(tasks, getTasksForCurrentWeek(tasks)));
    case 'nextWeek':
      return sortTasksForPlanning(getWeekViewTasks(tasks, getTasksForNextWeek(tasks)));
    case 'later':
      return sortTasksForPlanning(getTasksForLater(tasks));
    case 'overdue':
      return sortOverdueTasks(getOverdueTasks(tasks));
    case 'done':
      return sortTasksForPlanning(getDoneTasks(tasks));
    case 'open':
    default:
      return sortTasksForPlanning(getOpenTasks(tasks));
  }
}

function getTaskContext(task: Task, projects: Project[], lifeAreas: LifeArea[]): TaskContextInfo {
  const project = task.projectId ? projects.find((item) => item.id === task.projectId) : undefined;
  const projectLifeArea = project?.lifeAreaId ? lifeAreas.find((item) => item.id === project.lifeAreaId) : undefined;
  const directLifeArea = task.lifeAreaId ? lifeAreas.find((item) => item.id === task.lifeAreaId) : undefined;

  if (project) {
    return {
      label: projectLifeArea ? `${projectLifeArea.name} → ${project.name}` : `Projekt: ${project.name}`,
      detail: projectLifeArea ? 'Lebensbereich → Projekt → Aufgabe' : 'Projekt → Aufgabe',
      tone: 'project',
    };
  }

  if (directLifeArea) {
    return {
      label: `${directLifeArea.name} → Direkte Aufgabe`,
      detail: 'Lebensbereich → Aufgabe ohne Projekt',
      tone: 'lifeArea',
    };
  }

  return {
    label: 'Ohne Zuordnung',
    detail: 'Kein Projekt- oder Lebensbereichskontext gesetzt',
    tone: 'unassigned',
  };
}

interface TaskCardProps {
  task: Task;
  context: TaskContextInfo;
  projects: Project[];
  lifeAreas: LifeArea[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onPlanToday: (taskId: string) => void;
  onPlanTomorrow: (taskId: string) => void;
  onClearPlannedDate: (taskId: string) => void;
  onSetPlannedDate: (taskId: string, plannedDate: string) => void;
  onSetDueDate: (taskId: string, dueDate: string) => void;
  onClearDueDate: (taskId: string) => void;
  onUpdateTask: (taskId: string, patch: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
}

function TaskCard({
  task,
  context,
  projects,
  lifeAreas,
  onStatusChange,
  onPlanToday,
  onPlanTomorrow,
  onClearPlannedDate,
  onSetPlannedDate,
  onSetDueDate,
  onClearDueDate,
  onUpdateTask,
  onDeleteTask,
}: TaskCardProps) {
  const overdue = isTaskOverdue(task);
  const isDone = task.status === 'done';
  const [dateDraft, setDateDraft] = useState<TaskDateDraft>(() => getTaskDateDraft(task));
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState<TaskEditDraft>(() => getTaskEditDraft(task));
  const [editError, setEditError] = useState<string | undefined>();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isPlanningOpen, setIsPlanningOpen] = useState(false);

  useEffect(() => {
    setDateDraft(getTaskDateDraft(task));
  }, [task.dueDate, task.plannedDate]);

  useEffect(() => {
    setEditDraft(getTaskEditDraft(task));
    setEditError(undefined);
    setIsEditOpen(false);
    setIsDeleteConfirmOpen(false);
    setIsPlanningOpen(false);
  }, [task.id]);

  const hasDateDraftChanges =
    dateDraft.plannedDate !== (task.plannedDate ?? '') || dateDraft.dueDate !== (task.dueDate ?? '');

  function updateDateDraft(patch: Partial<TaskDateDraft>) {
    setDateDraft((current) => ({ ...current, ...patch }));
  }

  function resetDateDraft() {
    setDateDraft(getTaskDateDraft(task));
  }

  function updateEditDraft(patch: Partial<TaskEditDraft>) {
    setEditDraft((current) => ({ ...current, ...patch }));
    setEditError(undefined);
  }

  function resetEditDraft() {
    setEditDraft(getTaskEditDraft(task));
    setEditError(undefined);
  }

  function saveDateDraft() {
    if (dateDraft.plannedDate !== (task.plannedDate ?? '')) {
      if (dateDraft.plannedDate) {
        onSetPlannedDate(task.id, dateDraft.plannedDate);
      } else {
        onClearPlannedDate(task.id);
      }
    }

    if (dateDraft.dueDate !== (task.dueDate ?? '')) {
      if (dateDraft.dueDate) {
        onSetDueDate(task.id, dateDraft.dueDate);
      } else {
        onClearDueDate(task.id);
      }
    }
  }

  function handleSaveTaskEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = editDraft.title.trim();

    if (!title) {
      setEditError('Bitte gib einen Aufgabentitel ein.');
      return;
    }

    const projectId = editDraft.projectId || undefined;

    onUpdateTask(task.id, {
      title,
      description: getOptionalTaskText(editDraft.description),
      priority: editDraft.priority,
      dueDate: editDraft.dueDate || undefined,
      plannedDate: editDraft.plannedDate || undefined,
      projectId,
      lifeAreaId: projectId ? undefined : editDraft.lifeAreaId || undefined,
    });

    if (editDraft.status !== task.status) {
      onStatusChange(task.id, editDraft.status);
    }

    setEditError(undefined);
    setIsEditOpen(false);
  }

  function handleDeleteTask() {
    onDeleteTask(task.id);
  }

  return (
    <article className={`lifehq-task-row ${isDone ? 'opacity-65' : ''} ${overdue ? 'border-[#D6AD64]/35' : ''}`}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className={`lifehq-task-status-dot ${task.status === 'in_progress' ? 'border-[#D6AD64]/35 bg-[#D6AD64]/15' : ''} ${isDone ? 'opacity-60' : ''}`} aria-hidden="true">
            {isDone && <span className="h-1.5 w-1.5 rounded-full bg-[#7E776E]" />}
            {task.status === 'in_progress' && <span className="h-1.5 w-1.5 rounded-full bg-[#D6AD64]" />}
          </span>

          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={isDone ? 'text-base font-semibold leading-6 text-[#7E776E]' : 'text-base font-semibold leading-6 text-[#F5F1EA]'}>{task.title}</h3>
              {overdue && <span className="lifehq-task-chip border-[#D6AD64]/30 bg-[#D6AD64]/10 text-[#F5F1EA]">Überfällig</span>}
            </div>
            {task.description && <p className="line-clamp-2 max-w-3xl text-xs leading-5 text-[#7E776E]">{task.description}</p>}
            <div className={`lifehq-task-context ${contextStyles[context.tone]}`}>
              <p className="font-medium">{context.label}</p>
              {context.detail && <p className="mt-1 text-[0.72rem] leading-4 text-[#7E776E]">{context.detail}</p>}
            </div>
          </div>
        </div>

        <div className="flex w-full flex-wrap gap-1.5 text-xs text-[#B8B1A7] xl:w-auto xl:max-w-[27rem] xl:justify-end">
          <span className={`lifehq-task-chip ${statusStyles[task.status]}`}>{statusLabels[task.status]}</span>
          <span className={task.priority === 'critical' ? 'lifehq-task-chip border-[#D6AD64]/30 bg-[#D6AD64]/10 text-[#F5F1EA]' : 'lifehq-task-chip'}>
            Priorität: {priorityLabels[task.priority]}
          </span>
          <span className={`lifehq-task-chip ${overdue ? 'border-[#D6AD64]/25 bg-[#D6AD64]/10 text-[#F5F1EA]' : ''}`}>
            Fällig: {formatDateDisplay(task.dueDate, 'Keine Fälligkeit')}{overdue ? ' · prüfen' : ''}
          </span>
          <span className="lifehq-task-chip">Geplant: {formatDateDisplay(task.plannedDate, 'Nicht geplant')}</span>
        </div>
      </div>

      {isDone && task.completedAt && <p className="mt-2 text-xs text-[#7E776E]">Erledigt am {formatDateDisplay(task.completedAt)}</p>}

      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-white/[0.07] pt-3 text-xs" aria-label={`Status und Aktionen für ${task.title}`}>
        {task.status !== 'open' && (
          <button type="button" onClick={() => onStatusChange(task.id, 'open')} className="lifehq-task-action-button">
            Wieder öffnen
          </button>
        )}
        {task.status !== 'in_progress' && (
          <button type="button" onClick={() => onStatusChange(task.id, 'in_progress')} className="lifehq-task-action-button lifehq-task-action-button-gold">
            In Arbeit
          </button>
        )}
        {task.status !== 'done' && (
          <button type="button" onClick={() => onStatusChange(task.id, 'done')} className="lifehq-task-action-button">
            Erledigen
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            resetEditDraft();
            setIsEditOpen((current) => !current);
            setIsDeleteConfirmOpen(false);
          }}
          className="lifehq-task-action-button"
        >
          Details
        </button>
        <button type="button" onClick={() => setIsDeleteConfirmOpen((current) => !current)} className="lifehq-task-action-button">
          Löschen
        </button>
      </div>

      {isDeleteConfirmOpen && (
        <div className="lifehq-danger-zone mt-4">
          <p className="text-sm text-[#B8B1A7]">Diese Aufgabe wirklich löschen?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => setIsDeleteConfirmOpen(false)} className="lifehq-task-action-button">Abbrechen</button>
            <button type="button" onClick={handleDeleteTask} className="lifehq-task-action-button lifehq-task-action-button-gold">Endgültig löschen</button>
          </div>
        </div>
      )}

      {isEditOpen && (
        <form onSubmit={handleSaveTaskEdit} className="lifehq-task-planning-panel">
          <p className="lifehq-label">Aufgabe bearbeiten</p>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <label className="space-y-2 text-xs text-[#B8B1A7]">
              <span className="lifehq-label">Titel</span>
              <input value={editDraft.title} onChange={(event) => updateEditDraft({ title: event.target.value })} className="lifehq-task-form-control min-h-10 px-3 py-2 text-xs" />
            </label>
            <label className="space-y-2 text-xs text-[#B8B1A7]">
              <span className="lifehq-label">Status</span>
              <select value={editDraft.status} onChange={(event) => updateEditDraft({ status: event.target.value as TaskStatus })} className="lifehq-task-form-control min-h-10 px-3 py-2 text-xs">
                {taskStatusOptions.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
              </select>
            </label>
            <label className="space-y-2 text-xs text-[#B8B1A7] lg:col-span-2">
              <span className="lifehq-label">Beschreibung</span>
              <textarea value={editDraft.description} onChange={(event) => updateEditDraft({ description: event.target.value })} rows={3} className="lifehq-task-form-control min-h-20 px-3 py-2 text-xs" />
            </label>
            <label className="space-y-2 text-xs text-[#B8B1A7]">
              <span className="lifehq-label">Priorität</span>
              <select value={editDraft.priority} onChange={(event) => updateEditDraft({ priority: event.target.value as Priority })} className="lifehq-task-form-control min-h-10 px-3 py-2 text-xs">
                {Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="space-y-2 text-xs text-[#B8B1A7]">
              <span className="lifehq-label">Projekt</span>
              <select value={editDraft.projectId} onChange={(event) => updateEditDraft({ projectId: event.target.value, lifeAreaId: event.target.value ? '' : editDraft.lifeAreaId })} className="lifehq-task-form-control min-h-10 px-3 py-2 text-xs">
                <option value="">Kein Projekt</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
            </label>
            <label className="space-y-2 text-xs text-[#B8B1A7]">
              <span className="lifehq-label">Lebensbereich</span>
              <select value={editDraft.lifeAreaId} onChange={(event) => updateEditDraft({ lifeAreaId: event.target.value })} disabled={Boolean(editDraft.projectId)} className="lifehq-task-form-control min-h-10 px-3 py-2 text-xs disabled:cursor-not-allowed disabled:text-[#7E776E]">
                <option value="">Kein Lebensbereich</option>
                {lifeAreas.map((lifeArea) => <option key={lifeArea.id} value={lifeArea.id}>{lifeArea.name}</option>)}
              </select>
            </label>
            <label className="space-y-2 text-xs text-[#B8B1A7]">
              <span className="lifehq-label">Fälligkeit</span>
              <input type="date" value={editDraft.dueDate} onChange={(event) => updateEditDraft({ dueDate: event.target.value })} className="lifehq-task-form-control min-h-10 px-3 py-2 text-xs" />
            </label>
            <label className="space-y-2 text-xs text-[#B8B1A7]">
              <span className="lifehq-label">Geplant</span>
              <input type="date" value={editDraft.plannedDate} onChange={(event) => updateEditDraft({ plannedDate: event.target.value })} className="lifehq-task-form-control min-h-10 px-3 py-2 text-xs" />
            </label>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {editError ? <p className="text-sm text-amber-100">{editError}</p> : <p className="text-sm text-[#7E776E]">Änderungen werden direkt in allen Task-Ansichten übernommen.</p>}
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => { resetEditDraft(); setIsEditOpen(false); }} className="lifehq-task-action-button">Abbrechen</button>
              <button type="submit" className="lifehq-task-action-button lifehq-task-action-button-gold">Speichern</button>
            </div>
          </div>
        </form>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
        <button type="button" onClick={() => setIsPlanningOpen((current) => !current)} className="lifehq-task-action-button">
          {isPlanningOpen ? 'Planung ausblenden' : 'Planung'}
        </button>
      </div>

      {isPlanningOpen && (
        <div className="lifehq-task-planning-panel">
        <p className="lifehq-label">Planung</p>
        <div className="mt-3 grid w-full min-w-0 max-w-full grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-end">
          <label className="block w-full min-w-0 max-w-full space-y-2 text-xs text-[#B8B1A7]">
            <span className="lifehq-label">Geplantes Datum</span>
            <input
              type="date"
              value={dateDraft.plannedDate}
              onChange={(event) => updateDateDraft({ plannedDate: event.target.value })}
              className="lifehq-task-form-control block min-h-10 w-full max-w-full min-w-0 box-border px-3 py-2 text-xs"
            />
          </label>
          <label className="block w-full min-w-0 max-w-full space-y-2 text-xs text-[#B8B1A7]">
            <span className="lifehq-label">Fälligkeit</span>
            <input
              type="date"
              value={dateDraft.dueDate}
              onChange={(event) => updateDateDraft({ dueDate: event.target.value })}
              className="lifehq-task-form-control block min-h-10 w-full max-w-full min-w-0 box-border px-3 py-2 text-xs"
            />
          </label>
          <div className="flex w-full min-w-0 max-w-full flex-wrap gap-2 md:col-span-2 xl:col-span-1 xl:justify-end">
            {hasDateDraftChanges && (
              <>
                <button type="button" onClick={saveDateDraft} className="lifehq-task-action-button lifehq-task-action-button-gold">
                  Speichern
                </button>
                <button type="button" onClick={resetDateDraft} className="lifehq-task-action-button">
                  Abbrechen
                </button>
              </>
            )}
            <button type="button" onClick={() => onPlanToday(task.id)} className="lifehq-task-action-button">
              Heute planen
            </button>
            <button type="button" onClick={() => onPlanTomorrow(task.id)} className="lifehq-task-action-button">
              Morgen planen
            </button>
            {task.plannedDate && (
              <button type="button" onClick={() => onClearPlannedDate(task.id)} className="lifehq-task-action-button">
                Planung entfernen
              </button>
            )}
            {task.dueDate && (
              <button type="button" onClick={() => onClearDueDate(task.id)} className="lifehq-task-action-button">
                Fälligkeit entfernen
              </button>
            )}
          </div>
        </div>
      </div>
      )}
    </article>
  );
}

const weekdayLabels = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

interface TaskListProps {
  tasks: Task[];
  projects: Project[];
  lifeAreas: LifeArea[];
  actions: TaskPlanningActions;
}

interface TaskPlanningActions {
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onPlanToday: (taskId: string) => void;
  onPlanTomorrow: (taskId: string) => void;
  onClearPlannedDate: (taskId: string) => void;
  onSetPlannedDate: (taskId: string, plannedDate: string) => void;
  onSetDueDate: (taskId: string, dueDate: string) => void;
  onClearDueDate: (taskId: string) => void;
  onUpdateTask: (taskId: string, patch: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
}

interface WeekTaskSectionProps extends TaskListProps {
  weekDays: string[];
}

function TaskList({ tasks, projects, lifeAreas, actions }: TaskListProps) {
  return (
    <div className="mt-4 grid gap-2.5">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          context={getTaskContext(task, projects, lifeAreas)}
          projects={projects}
          lifeAreas={lifeAreas}
          {...actions}
        />
      ))}
    </div>
  );
}

function WeekTaskSection({ tasks, projects, lifeAreas, actions, weekDays }: WeekTaskSectionProps) {
  const unplannedTasks = sortTasksForPlanning(getUnplannedOpenTasks(tasks));
  const overdueTasks = sortOverdueTasks(getOverdueTasks(tasks));
  const plannedDayGroups = weekDays
    .map((day, index) => ({
      day,
      label: weekdayLabels[index],
      tasks: sortTasksForPlanning(tasks.filter((task) => task.status !== 'done' && isSameDay(task.plannedDate, day))),
    }))
    .filter((group) => group.tasks.length > 0);
  const hasRelevantWeekTasks = plannedDayGroups.length > 0 || unplannedTasks.length > 0 || overdueTasks.length > 0;

  if (!hasRelevantWeekTasks) {
    return <p className="lifehq-empty-task-state mt-5">Für diesen Zeitraum sind keine Aufgaben geplant.</p>;
  }

  return (
    <div className="space-y-5">
      {overdueTasks.length > 0 && (
        <div className="lifehq-empty-task-state border-[#D6AD64]/20 bg-[#D6AD64]/10">
          <p className="lifehq-label text-[#D6AD64]">Ruhiger Hinweis</p>
          <p className="mt-2 text-sm text-[#B8B1A7]">Es gibt überfällige Aufgaben. Sie bleiben sichtbar, ohne die Wochenplanung zu dominieren.</p>
        </div>
      )}

      {plannedDayGroups.length > 0 && (
        <div className="space-y-3">
          {plannedDayGroups.map((group) => (
            <section key={group.day} className="lifehq-week-section">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <div className="lifehq-section-title">
                  <span aria-hidden="true" />
                  <p className="text-sm font-semibold text-[#F5F1EA]">{group.label}</p>
                </div>
                <p className="lifehq-label">{formatDateDisplay(group.day)}</p>
              </div>
              <TaskList tasks={group.tasks} projects={projects} lifeAreas={lifeAreas} actions={actions} />
            </section>
          ))}
        </div>
      )}

      {unplannedTasks.length > 0 && (
        <section className="lifehq-week-section">
          <p className="lifehq-label">Ohne geplantes Datum</p>
          <p className="mt-2 text-sm leading-6 text-[#7E776E]">Diese offenen Aufgaben sind noch keinem Tag zugeordnet und bleiben als ruhiger Planungsvorrat sichtbar.</p>
          <TaskList tasks={unplannedTasks} projects={projects} lifeAreas={lifeAreas} actions={actions} />
        </section>
      )}
    </div>
  );
}

export function TasksPage() {
  const [activeView, setActiveView] = useState<TaskView>('today');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [taskDraft, setTaskDraft] = useState<TaskDraft>(defaultTaskDraft);
  const [createError, setCreateError] = useState<string | undefined>();
  const tasks = useLifeHQStore(selectTasks);
  const projects = useLifeHQStore(selectProjects);
  const lifeAreas = useLifeHQStore(selectLifeAreas);
  const addTask = useLifeHQStore((state) => state.addTask);
  const updateTaskStatus = useLifeHQStore((state) => state.updateTaskStatus);
  const scheduleTaskForToday = useLifeHQStore((state) => state.scheduleTaskForToday);
  const scheduleTaskForTomorrow = useLifeHQStore((state) => state.scheduleTaskForTomorrow);
  const clearTaskPlannedDate = useLifeHQStore((state) => state.clearTaskPlannedDate);
  const setTaskPlannedDate = useLifeHQStore((state) => state.setTaskPlannedDate);
  const setTaskDueDate = useLifeHQStore((state) => state.setTaskDueDate);
  const clearTaskDueDate = useLifeHQStore((state) => state.clearTaskDueDate);
  const updateTask = useLifeHQStore((state) => state.updateTask);
  const deleteTask = useLifeHQStore((state) => state.deleteTask);

  const visibleTasks = useMemo(() => getVisibleTasks(tasks, activeView), [activeView, tasks]);
  const activeViewMeta = taskViews.find((view) => view.id === activeView) ?? taskViews[0];
  const taskPlanningActions: TaskPlanningActions = {
    onStatusChange: updateTaskStatus,
    onPlanToday: scheduleTaskForToday,
    onPlanTomorrow: scheduleTaskForTomorrow,
    onClearPlannedDate: clearTaskPlannedDate,
    onSetPlannedDate: setTaskPlannedDate,
    onSetDueDate: setTaskDueDate,
    onClearDueDate: clearTaskDueDate,
    onUpdateTask: updateTask,
    onDeleteTask: deleteTask,
  };

  function updateTaskDraft(patch: Partial<TaskDraft>) {
    setTaskDraft((current) => ({ ...current, ...patch }));
    setCreateError(undefined);
  }

  function resetTaskDraft() {
    setTaskDraft(defaultTaskDraft);
    setCreateError(undefined);
  }

  function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = taskDraft.title.trim();

    if (!title) {
      setCreateError('Bitte gib einen Aufgabentitel ein.');
      return;
    }

    const createdAt = new Date().toISOString();
    const projectId = taskDraft.projectId || undefined;

    addTask({
      id: createTaskId(),
      title,
      description: getOptionalTaskText(taskDraft.description),
      status: 'open',
      priority: taskDraft.priority,
      dueDate: taskDraft.dueDate || undefined,
      plannedDate: taskDraft.plannedDate || undefined,
      projectId,
      lifeAreaId: projectId ? undefined : taskDraft.lifeAreaId || undefined,
      createdAt,
      updatedAt: createdAt,
    });

    resetTaskDraft();
    setIsCreateOpen(false);
  }

  return (
    <section className="space-y-8">
      <div className="lifehq-tasks-hero">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-[#D6AD64]/70">OPERATIVE EBENE</p>
          <div className="space-y-2">
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-[#F5F1EA] sm:text-6xl lg:text-[4rem]">Aufgaben</h1>
            <p className="max-w-2xl text-base leading-7 text-[#B8B1A7]">
              Eine ruhige operative Arbeitsfläche für die nächsten konkreten Schritte.
            </p>
          </div>
        </div>

        <button
          type="button"
          aria-controls="task-create-form"
          aria-expanded={isCreateOpen}
          onClick={() => setIsCreateOpen((current) => !current)}
          className="lifehq-button-primary w-full sm:w-fit"
        >
          Neue Aufgabe
        </button>
      </div>

      {isCreateOpen && (
        <form id="task-create-form" onSubmit={handleCreateTask} className="lifehq-task-form lifehq-task-form-compact">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="lifehq-label">Neue Aufgabe</p>
              <h3 className="mt-1 text-base font-semibold text-[#F5F1EA]">Schnellen nächsten Schritt erfassen</h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[#7E776E]">
                Lege nur den Titel fest oder ergänze optional Priorität, Zuordnung und einfache Datumsfelder.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetTaskDraft();
                setIsCreateOpen(false);
              }}
              className="lifehq-button-secondary w-fit text-xs"
            >
              Abbrechen
            </button>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,2fr)_1fr_1fr]">
            <label className="space-y-1.5 text-sm text-[#B8B1A7] lg:col-span-3">
              <span className="lifehq-label">Titel</span>
              <input
                value={taskDraft.title}
                onChange={(event) => updateTaskDraft({ title: event.target.value })}
                placeholder="Was ist der nächste konkrete Schritt?"
                className="lifehq-task-form-control"
              />
            </label>

            <label className="space-y-1.5 text-sm text-[#B8B1A7] lg:col-span-3">
              <span className="lifehq-label">Beschreibung</span>
              <textarea
                value={taskDraft.description}
                onChange={(event) => updateTaskDraft({ description: event.target.value })}
                placeholder="Optionale Beschreibung"
                rows={3}
                className="lifehq-task-form-control"
              />
            </label>

            <label className="space-y-1.5 text-sm text-[#B8B1A7]">
              <span className="lifehq-label">Priorität</span>
              <select
                value={taskDraft.priority}
                onChange={(event) => updateTaskDraft({ priority: event.target.value as Priority })}
                className="lifehq-task-form-control"
              >
                {Object.entries(priorityLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-sm text-[#B8B1A7]">
              <span className="lifehq-label">Projekt</span>
              <select
                value={taskDraft.projectId}
                onChange={(event) => updateTaskDraft({ projectId: event.target.value, lifeAreaId: event.target.value ? '' : taskDraft.lifeAreaId })}
                className="lifehq-task-form-control"
              >
                <option value="">Kein Projekt</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-sm text-[#B8B1A7]">
              <span className="lifehq-label">Lebensbereich</span>
              <select
                value={taskDraft.lifeAreaId}
                onChange={(event) => updateTaskDraft({ lifeAreaId: event.target.value })}
                disabled={Boolean(taskDraft.projectId)}
                className="lifehq-task-form-control disabled:cursor-not-allowed disabled:text-[#7E776E]"
              >
                <option value="">Kein Lebensbereich</option>
                {lifeAreas.map((lifeArea) => (
                  <option key={lifeArea.id} value={lifeArea.id}>{lifeArea.name}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-sm text-[#B8B1A7]">
              <span className="lifehq-label">Fälligkeit</span>
              <input
                type="date"
                value={taskDraft.dueDate}
                onChange={(event) => updateTaskDraft({ dueDate: event.target.value })}
                className="lifehq-task-form-control"
              />
            </label>

            <label className="space-y-1.5 text-sm text-[#B8B1A7]">
              <span className="lifehq-label">Geplant</span>
              <input
                type="date"
                value={taskDraft.plannedDate}
                onChange={(event) => updateTaskDraft({ plannedDate: event.target.value })}
                className="lifehq-task-form-control"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {createError ? <p className="text-sm text-amber-100">{createError}</p> : <p className="text-sm text-[#7E776E]">Status startet als offen, Priorität standardmäßig mittel.</p>}
            <button
              type="submit"
              className="lifehq-button-primary w-fit"
            >
              Aufgabe erstellen
            </button>
          </div>
        </form>
      )}

      <div className="lifehq-task-view-switcher">
        <div className="lifehq-scrollbar-none flex gap-2 overflow-x-auto pb-1 md:grid md:grid-cols-4 md:overflow-visible md:pb-0 xl:grid-cols-7">
          {taskViews.map((view) => (
            <button
              key={view.id}
              type="button"
              onClick={() => setActiveView(view.id)}
              className={`lifehq-task-view-item ${
                activeView === view.id ? 'lifehq-task-view-item-active' : ''
              }`}
            >
              <span className="block font-semibold">{view.label}</span>
              <span className="mt-1 block text-xs opacity-70">{getVisibleTasks(tasks, view.id).length} Aufgaben</span>
            </button>
          ))}
        </div>
      </div>

      {!isCreateOpen && (
        <div className="lifehq-task-section">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="lifehq-section-title">
              <span aria-hidden="true" />
              <p className="lifehq-label">Aktive Ansicht</p>
            </div>
            <h2 className="mt-2 font-serif text-2xl font-semibold tracking-tight text-[#F5F1EA]">{activeViewMeta.label}</h2>
            <p className="mt-2 text-sm leading-6 text-[#7E776E]">{activeViewMeta.description}</p>
          </div>
          <p className="lifehq-badge w-fit">{visibleTasks.length} sichtbar</p>
        </div>

        {activeView === 'week' ? (
          <WeekTaskSection tasks={tasks} projects={projects} lifeAreas={lifeAreas} actions={taskPlanningActions} weekDays={getWeekDays()} />
        ) : activeView === 'nextWeek' ? (
          <WeekTaskSection tasks={tasks} projects={projects} lifeAreas={lifeAreas} actions={taskPlanningActions} weekDays={getNextWeekDays()} />
        ) : visibleTasks.length === 0 ? (
          <p className="lifehq-empty-task-state mt-5">
            {emptyStateMessages[activeView]}
          </p>
        ) : (
          <TaskList tasks={visibleTasks} projects={projects} lifeAreas={lifeAreas} actions={taskPlanningActions} />
        )}
        </div>
      )}
    </section>
  );
}
