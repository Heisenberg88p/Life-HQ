import { useMemo, useState } from 'react';
import { getWeekDays, isSameDay } from '../../logic/dateLogic';
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
  getTasksForToday,
  isTaskOverdue,
} from '../../logic/taskLogic';

type TaskView = 'today' | 'week' | 'overdue' | 'open' | 'done';

type TaskDraft = {
  title: string;
  priority: Priority;
  projectId: string;
  lifeAreaId: string;
  dueDate: string;
  plannedDate: string;
};

const taskViews: Array<{ id: TaskView; label: string; description: string }> = [
  { id: 'today', label: 'Heute', description: 'Geplante Schritte für den aktuellen Tag.' },
  { id: 'week', label: 'Diese Woche', description: 'Geplante Aufgaben innerhalb der aktuellen Woche.' },
  { id: 'overdue', label: 'Überfällig', description: 'Fällige Aufgaben, die noch nicht erledigt sind.' },
  { id: 'open', label: 'Offen', description: 'Alles, was offen oder in Arbeit ist.' },
  { id: 'done', label: 'Erledigte Aufgaben', description: 'Abgeschlossene operative Schritte.' },
];

const statusLabels: Record<TaskStatus, string> = {
  open: 'Offen',
  in_progress: 'In Arbeit',
  done: 'Erledigt',
};

const priorityLabels: Record<Priority, string> = {
  low: 'Niedrig',
  medium: 'Mittel',
  high: 'Hoch',
  critical: 'Kritisch',
};

const emptyStateMessages: Record<TaskView, string> = {
  today: 'Für heute sind keine Aufgaben geplant.',
  week: 'Für diese Woche sind noch keine Aufgaben geplant.',
  overdue: 'Keine überfälligen Aufgaben.',
  open: 'Keine offenen Aufgaben.',
  done: 'Noch keine erledigten Aufgaben.',
};

const statusStyles: Record<TaskStatus, string> = {
  open: 'border-slate-700/60 bg-slate-950/40 text-slate-300',
  in_progress: 'border-sky-300/30 bg-sky-950/20 text-sky-100',
  done: 'border-emerald-300/20 bg-emerald-950/15 text-emerald-100',
};

interface TaskContextInfo {
  label: string;
  detail?: string;
  tone: 'project' | 'lifeArea' | 'unassigned';
}

const contextStyles: Record<TaskContextInfo['tone'], string> = {
  project: 'border-sky-300/20 bg-sky-950/10 text-sky-100',
  lifeArea: 'border-emerald-300/20 bg-emerald-950/10 text-emerald-100',
  unassigned: 'border-slate-700/60 bg-slate-950/30 text-slate-400',
};

const defaultTaskDraft: TaskDraft = {
  title: '',
  priority: 'medium',
  projectId: '',
  lifeAreaId: '',
  dueDate: '',
  plannedDate: '',
};

function createTaskId(): string {
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getVisibleTasks(tasks: Task[], activeView: TaskView): Task[] {
  switch (activeView) {
    case 'today':
      return getTasksForToday(tasks);
    case 'week':
      return getTasksForCurrentWeek(tasks);
    case 'overdue':
      return getOverdueTasks(tasks);
    case 'done':
      return getDoneTasks(tasks);
    case 'open':
    default:
      return getOpenTasks(tasks);
  }
}

function getTaskContext(task: Task, projects: Project[], lifeAreas: LifeArea[]): TaskContextInfo {
  const project = task.projectId ? projects.find((item) => item.id === task.projectId) : undefined;
  const projectLifeArea = project?.lifeAreaId ? lifeAreas.find((item) => item.id === project.lifeAreaId) : undefined;
  const directLifeArea = task.lifeAreaId ? lifeAreas.find((item) => item.id === task.lifeAreaId) : undefined;

  if (project) {
    return {
      label: `Projekt: ${project.name}`,
      detail: projectLifeArea ? `Bereich: ${projectLifeArea.name}` : undefined,
      tone: 'project',
    };
  }

  if (directLifeArea) {
    return {
      label: `Bereich: ${directLifeArea.name}`,
      detail: 'Direkt dem Lebensbereich zugeordnet',
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
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onPlanToday: (taskId: string) => void;
  onPlanTomorrow: (taskId: string) => void;
  onClearPlannedDate: (taskId: string) => void;
  onSetPlannedDate: (taskId: string, plannedDate: string) => void;
  onSetDueDate: (taskId: string, dueDate: string) => void;
  onClearDueDate: (taskId: string) => void;
}

function TaskCard({
  task,
  context,
  onStatusChange,
  onPlanToday,
  onPlanTomorrow,
  onClearPlannedDate,
  onSetPlannedDate,
  onSetDueDate,
  onClearDueDate,
}: TaskCardProps) {
  const overdue = isTaskOverdue(task);
  const isDone = task.status === 'done';

  return (
    <article
      className={`rounded-2xl border p-4 transition-colors ${
        isDone
          ? 'border-slate-700/30 bg-slate-950/10 opacity-75'
          : overdue
            ? 'border-amber-300/30 border-l-4 border-l-amber-300/50 bg-amber-950/10'
            : 'border-slate-700/50 bg-slate-950/20'
      }`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={isDone ? 'text-sm font-semibold text-slate-400 line-through decoration-slate-600' : 'text-sm font-semibold text-slate-100'}>{task.title}</h3>
            {overdue && <span className="rounded-full border border-amber-300/30 bg-amber-950/20 px-2.5 py-1 text-xs text-amber-100">Überfällig</span>}
          </div>
          {task.description && <p className="text-sm leading-6 text-slate-400">{task.description}</p>}
          <div className={`w-fit rounded-xl border px-3 py-2 text-xs ${contextStyles[context.tone]}`}>
            <p className="font-medium">{context.label}</p>
            {context.detail && <p className="mt-1 text-[0.7rem] text-slate-400">{context.detail}</p>}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-slate-300 lg:justify-end">
          <span className={`rounded-full border px-2.5 py-1 ${statusStyles[task.status]}`}>{statusLabels[task.status]}</span>
          <span className={task.priority === 'critical' ? 'rounded-full border border-rose-300/30 bg-rose-950/25 px-2.5 py-1 text-rose-100' : 'rounded-full border border-slate-700/60 bg-slate-950/40 px-2.5 py-1'}>
            Priorität: {priorityLabels[task.priority]}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-xs text-slate-500 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
        <p className={overdue ? 'font-medium text-amber-100' : undefined}>
          Fälligkeit: {task.dueDate ?? 'Keine Fälligkeit'}{overdue ? ' · überfällig' : ''}
        </p>
        <div className="space-y-1">
          <p>Geplant: {task.plannedDate ?? 'Nicht geplant'}</p>
          {isDone && <p>Erledigt: {task.completedAt ? task.completedAt.slice(0, 10) : 'Datum nicht gesetzt'}</p>}
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end" aria-label={`Status für ${task.title} ändern`}>
          {task.status !== 'open' && (
            <button
              type="button"
              onClick={() => onStatusChange(task.id, 'open')}
              className="rounded-xl border border-slate-700/70 bg-slate-950/40 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
            >
              Wieder öffnen
            </button>
          )}
          {task.status !== 'in_progress' && (
            <button
              type="button"
              onClick={() => onStatusChange(task.id, 'in_progress')}
              className="rounded-xl border border-sky-300/20 bg-sky-950/10 px-3 py-2 text-xs font-medium text-sky-100 transition-colors hover:border-sky-300/40"
            >
              In Arbeit
            </button>
          )}
          {task.status !== 'done' && (
            <button
              type="button"
              onClick={() => onStatusChange(task.id, 'done')}
              className="rounded-xl border border-emerald-300/20 bg-emerald-950/10 px-3 py-2 text-xs font-medium text-emerald-100 transition-colors hover:border-emerald-300/40"
            >
              Erledigen
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-800/80 bg-slate-950/20 p-3">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">Planung</p>
        <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <label className="space-y-2 text-xs text-slate-400">
            <span>Geplantes Datum</span>
            <input
              type="date"
              value={task.plannedDate ?? ''}
              onChange={(event) => {
                if (event.target.value) {
                  onSetPlannedDate(task.id, event.target.value);
                } else {
                  onClearPlannedDate(task.id);
                }
              }}
              className="w-full rounded-xl border border-slate-700/70 bg-slate-950/40 px-3 py-2 text-xs text-slate-100 outline-none transition-colors focus:border-slate-400"
            />
          </label>
          <label className="space-y-2 text-xs text-slate-400">
            <span>Fälligkeit</span>
            <input
              type="date"
              value={task.dueDate ?? ''}
              onChange={(event) => {
                if (event.target.value) {
                  onSetDueDate(task.id, event.target.value);
                } else {
                  onClearDueDate(task.id);
                }
              }}
              className="w-full rounded-xl border border-slate-700/70 bg-slate-950/40 px-3 py-2 text-xs text-slate-100 outline-none transition-colors focus:border-slate-400"
            />
          </label>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <button
              type="button"
              onClick={() => onPlanToday(task.id)}
              className="rounded-xl border border-slate-700/70 bg-slate-950/40 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
            >
              Heute planen
            </button>
            <button
              type="button"
              onClick={() => onPlanTomorrow(task.id)}
              className="rounded-xl border border-slate-700/70 bg-slate-950/40 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
            >
              Morgen planen
            </button>
            {task.plannedDate && (
              <button
                type="button"
                onClick={() => onClearPlannedDate(task.id)}
                className="rounded-xl border border-slate-700/70 bg-slate-950/20 px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:border-slate-500 hover:text-white"
              >
                Planung entfernen
              </button>
            )}
            {task.dueDate && (
              <button
                type="button"
                onClick={() => onClearDueDate(task.id)}
                className="rounded-xl border border-slate-700/70 bg-slate-950/20 px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:border-slate-500 hover:text-white"
              >
                Fälligkeit entfernen
              </button>
            )}
          </div>
        </div>
      </div>
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
}

function TaskList({ tasks, projects, lifeAreas, actions }: TaskListProps) {
  return (
    <div className="mt-5 grid gap-3">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          context={getTaskContext(task, projects, lifeAreas)}
          {...actions}
        />
      ))}
    </div>
  );
}

function WeekTaskSection({ tasks, projects, lifeAreas, actions }: TaskListProps) {
  const weekDays = getWeekDays();
  const unplannedTasks = tasks.filter((task) => !task.plannedDate && task.status !== 'done');
  const overdueTasks = getOverdueTasks(tasks);

  return (
    <div className="mt-5 space-y-5">
      {overdueTasks.length > 0 && (
        <div className="rounded-2xl border border-amber-300/20 bg-amber-950/10 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-amber-100">Ruhiger Hinweis</p>
          <p className="mt-2 text-sm text-slate-300">Es gibt überfällige Aufgaben. Sie bleiben sichtbar, ohne die Wochenplanung zu dominieren.</p>
        </div>
      )}

      <div className="space-y-3">
        {weekDays.map((day, index) => {
          const dayTasks = tasks.filter((task) => isSameDay(task.plannedDate, day));

          return (
            <section key={day} className="rounded-2xl border border-slate-800/80 bg-slate-950/20 p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <p className="text-sm font-semibold text-slate-100">{weekdayLabels[index]}</p>
                <p className="text-xs text-slate-500">{day}</p>
              </div>
              {dayTasks.length === 0 ? (
                <p className="mt-4 text-xs leading-5 text-slate-600">Keine Aufgaben geplant.</p>
              ) : (
                <TaskList tasks={dayTasks} projects={projects} lifeAreas={lifeAreas} actions={actions} />
              )}
            </section>
          );
        })}
      </div>

      {unplannedTasks.length > 0 && (
        <section className="rounded-2xl border border-slate-800/80 bg-slate-950/20 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Ohne geplantes Datum</p>
          <p className="mt-2 text-sm text-slate-400">Diese offenen Aufgaben sind noch keinem Tag zugeordnet.</p>
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
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Operational Execution</p>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold sm:text-3xl">Tasks</h2>
            <p className="max-w-2xl text-sm leading-6 text-slate-300">
              Plane und kläre die nächsten konkreten Schritte, ohne das HQ in eine Aufgabenliste zu verwandeln.
            </p>
          </div>
        </div>

        <button
          type="button"
          aria-controls="task-create-form"
          aria-expanded={isCreateOpen}
          onClick={() => setIsCreateOpen((current) => !current)}
          className="w-fit rounded-full border border-slate-200/20 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-white"
        >
          Neue Aufgabe
        </button>
      </div>

      {isCreateOpen && (
        <form id="task-create-form" onSubmit={handleCreateTask} className="rounded-3xl border border-slate-700/50 bg-slate-900/30 p-5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Neue Aufgabe</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-100">Schnellen nächsten Schritt erfassen</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Lege nur den Titel fest oder ergänze optional Priorität, Zuordnung und einfache Datumsfelder.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetTaskDraft();
                setIsCreateOpen(false);
              }}
              className="w-fit rounded-xl border border-slate-700/70 bg-slate-950/30 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
            >
              Abbrechen
            </button>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,2fr)_1fr_1fr]">
            <label className="space-y-2 text-sm text-slate-300 lg:col-span-3">
              <span className="text-xs uppercase tracking-[0.16em] text-muted">Titel</span>
              <input
                value={taskDraft.title}
                onChange={(event) => updateTaskDraft({ title: event.target.value })}
                placeholder="Was ist der nächste konkrete Schritt?"
                className="w-full rounded-2xl border border-slate-700/70 bg-slate-950/40 px-4 py-3 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-slate-400"
              />
            </label>

            <label className="space-y-2 text-sm text-slate-300">
              <span className="text-xs uppercase tracking-[0.16em] text-muted">Priorität</span>
              <select
                value={taskDraft.priority}
                onChange={(event) => updateTaskDraft({ priority: event.target.value as Priority })}
                className="w-full rounded-2xl border border-slate-700/70 bg-slate-950/40 px-4 py-3 text-sm text-slate-100 outline-none transition-colors focus:border-slate-400"
              >
                {Object.entries(priorityLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm text-slate-300">
              <span className="text-xs uppercase tracking-[0.16em] text-muted">Projekt</span>
              <select
                value={taskDraft.projectId}
                onChange={(event) => updateTaskDraft({ projectId: event.target.value, lifeAreaId: event.target.value ? '' : taskDraft.lifeAreaId })}
                className="w-full rounded-2xl border border-slate-700/70 bg-slate-950/40 px-4 py-3 text-sm text-slate-100 outline-none transition-colors focus:border-slate-400"
              >
                <option value="">Kein Projekt</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm text-slate-300">
              <span className="text-xs uppercase tracking-[0.16em] text-muted">Lebensbereich</span>
              <select
                value={taskDraft.lifeAreaId}
                onChange={(event) => updateTaskDraft({ lifeAreaId: event.target.value })}
                disabled={Boolean(taskDraft.projectId)}
                className="w-full rounded-2xl border border-slate-700/70 bg-slate-950/40 px-4 py-3 text-sm text-slate-100 outline-none transition-colors focus:border-slate-400 disabled:cursor-not-allowed disabled:text-slate-600"
              >
                <option value="">Kein Lebensbereich</option>
                {lifeAreas.map((lifeArea) => (
                  <option key={lifeArea.id} value={lifeArea.id}>{lifeArea.name}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm text-slate-300">
              <span className="text-xs uppercase tracking-[0.16em] text-muted">Fälligkeit</span>
              <input
                type="date"
                value={taskDraft.dueDate}
                onChange={(event) => updateTaskDraft({ dueDate: event.target.value })}
                className="w-full rounded-2xl border border-slate-700/70 bg-slate-950/40 px-4 py-3 text-sm text-slate-100 outline-none transition-colors focus:border-slate-400"
              />
            </label>

            <label className="space-y-2 text-sm text-slate-300">
              <span className="text-xs uppercase tracking-[0.16em] text-muted">Geplant</span>
              <input
                type="date"
                value={taskDraft.plannedDate}
                onChange={(event) => updateTaskDraft({ plannedDate: event.target.value })}
                className="w-full rounded-2xl border border-slate-700/70 bg-slate-950/40 px-4 py-3 text-sm text-slate-100 outline-none transition-colors focus:border-slate-400"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {createError ? <p className="text-sm text-amber-100">{createError}</p> : <p className="text-sm text-slate-500">Status startet als offen, Priorität standardmäßig mittel.</p>}
            <button
              type="submit"
              className="w-fit rounded-full border border-emerald-300/20 bg-emerald-950/20 px-4 py-2 text-sm font-medium text-emerald-100 transition-colors hover:border-emerald-300/40"
            >
              Aufgabe erstellen
            </button>
          </div>
        </form>
      )}

      <div className="rounded-3xl border border-slate-700/50 bg-slate-950/20 p-3">
        <div className="grid gap-2 md:grid-cols-5">
          {taskViews.map((view) => (
            <button
              key={view.id}
              type="button"
              onClick={() => setActiveView(view.id)}
              className={`rounded-2xl border px-3 py-3 text-left text-sm transition-colors ${
                activeView === view.id
                  ? 'border-slate-200/20 bg-slate-100 text-slate-950'
                  : 'border-transparent text-slate-300 hover:border-slate-700 hover:bg-slate-900/60 hover:text-white'
              }`}
            >
              <span className="block font-semibold">{view.label}</span>
              <span className="mt-1 block text-xs opacity-70">{getVisibleTasks(tasks, view.id).length} Aufgaben</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-700/50 bg-slate-900/25 p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Task View</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-100">{activeViewMeta.label}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">{activeViewMeta.description}</p>
          </div>
          <p className="text-sm text-slate-500">{visibleTasks.length} sichtbar</p>
        </div>

        {activeView === 'week' ? (
          <WeekTaskSection tasks={tasks} projects={projects} lifeAreas={lifeAreas} actions={taskPlanningActions} />
        ) : visibleTasks.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-dashed border-slate-700/70 bg-slate-950/10 px-4 py-3 text-sm leading-6 text-slate-500">
            {emptyStateMessages[activeView]}
          </p>
        ) : (
          <TaskList tasks={visibleTasks} projects={projects} lifeAreas={lifeAreas} actions={taskPlanningActions} />
        )}
      </div>
    </section>
  );
}
