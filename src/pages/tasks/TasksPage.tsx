import { useMemo, useState } from 'react';
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

const taskViews: Array<{ id: TaskView; label: string; description: string }> = [
  { id: 'today', label: 'Heute', description: 'Geplante Schritte für den aktuellen Tag.' },
  { id: 'week', label: 'Diese Woche', description: 'Geplante Aufgaben innerhalb der aktuellen Woche.' },
  { id: 'overdue', label: 'Überfällig', description: 'Fällige Aufgaben, die noch nicht erledigt sind.' },
  { id: 'open', label: 'Alle offenen Aufgaben', description: 'Alles, was offen oder in Arbeit ist.' },
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
}

function TaskCard({ task, context, onStatusChange }: TaskCardProps) {
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
        <p>Geplant: {task.plannedDate ?? 'Nicht geplant'}</p>
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
    </article>
  );
}

export function TasksPage() {
  const [activeView, setActiveView] = useState<TaskView>('today');
  const tasks = useLifeHQStore(selectTasks);
  const projects = useLifeHQStore(selectProjects);
  const lifeAreas = useLifeHQStore(selectLifeAreas);
  const updateTaskStatus = useLifeHQStore((state) => state.updateTaskStatus);

  const visibleTasks = useMemo(() => getVisibleTasks(tasks, activeView), [activeView, tasks]);
  const activeViewMeta = taskViews.find((view) => view.id === activeView) ?? taskViews[0];

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
          disabled
          className="w-fit cursor-not-allowed rounded-full border border-slate-700/60 bg-slate-950/40 px-4 py-2 text-sm font-medium text-slate-500"
        >
          Neue Aufgabe vorbereiten
        </button>
      </div>

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

        {visibleTasks.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-dashed border-slate-700/70 bg-slate-950/10 px-4 py-3 text-sm leading-6 text-slate-500">
            {emptyStateMessages[activeView]}
          </p>
        ) : (
          <div className="mt-5 grid gap-3">
            {visibleTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                context={getTaskContext(task, projects, lifeAreas)}
                onStatusChange={updateTaskStatus}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
