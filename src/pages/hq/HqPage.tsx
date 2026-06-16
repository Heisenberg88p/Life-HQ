import { useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Focus, FocusPriority, FocusStatus } from '../../models/focus';
import type { LifeArea } from '../../models/lifeArea';
import type { Milestone } from '../../models/milestone';
import type { Project } from '../../models/project';
import type { Task } from '../../models/task';
import type { TrueNorth } from '../../models/trueNorth';
import type { Priority, ProjectStatus, TrafficLightStatus } from '../../models/common';
import { priorityLabels, projectStatusLabels, trafficLightLabels } from '../../constants/displayLabels';
import {
  selectActiveProjects,
  selectCompletedProjects,
  selectCriticalProjects,
  selectFocuses,
  selectLifeAreas,
  selectMilestones,
  selectPausedProjects,
  selectTasks,
  selectTrueNorths,
  selectPlannedProjects,
  useLifeHQStore,
} from '../../store';


type FocusDraft = {
  title: string;
  description: string;
  status: FocusStatus;
  priority: FocusPriority;
  startDate: string;
  targetDate: string;
  trueNorthReference: string;
};

type TrueNorthDraft = {
  title: string;
  description: string;
};

type LifeAreaDraft = {
  name: string;
  description: string;
};

type ProjectDraft = {
  name: string;
  description: string;
  lifeAreaId: string;
  focusId: string;
  status: ProjectStatus;
  priority: Priority;
  trafficLightStatus: TrafficLightStatus;
  targetDate: string;
};

const focusStatusLabels: Record<FocusStatus, string> = {
  Active: 'Aktueller Fokus',
  Paused: 'Zurückgenommen',
  Completed: 'Abgeschlossen',
  Archived: 'Archiviert',
};

const focusPriorityLabels: Record<FocusPriority, string> = {
  High: 'Hoch',
  Medium: 'Mittel',
  Low: 'Niedrig',
};

const getTodayDateOnly = () => new Date().toISOString().slice(0, 10);

const createDefaultFocusDraft = (): FocusDraft => ({
  title: '',
  description: '',
  status: 'Active',
  priority: 'Medium',
  startDate: getTodayDateOnly(),
  targetDate: '',
  trueNorthReference: '',
});

const defaultTrueNorthDraft: TrueNorthDraft = { title: '', description: '' };
const defaultLifeAreaDraft: LifeAreaDraft = { name: '', description: '' };
const defaultProjectDraft: ProjectDraft = {
  name: '',
  description: '',
  lifeAreaId: '',
  focusId: '',
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

interface HqSectionProps {
  title: string;
  description?: string;
  eyebrow?: string;
  children: ReactNode;
  prominence?: 'primary' | 'secondary' | 'focus';
  action?: ReactNode;
}

function HqSection({ title, description, eyebrow, children, prominence = 'secondary', action }: HqSectionProps) {
  const sectionClassName =
    prominence === 'primary'
      ? 'space-y-6'
      : prominence === 'focus'
        ? 'lifehq-premium-card space-y-5 border-[#D6AD64]/25 bg-[#D6AD64]/[0.045] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.24)] sm:p-7'
        : 'lifehq-secondary-project-panel space-y-4 p-4 sm:p-5';
  const titleClassName =
    prominence === 'primary' || prominence === 'focus'
      ? 'font-serif text-xl font-semibold tracking-tight text-[#F5F1EA] sm:text-2xl'
      : 'text-lg font-semibold tracking-tight text-[#F5F1EA]';

  return (
    <section className={sectionClassName}>
      <div className="space-y-2">
        {eyebrow && <p className="text-xs uppercase tracking-[0.24em] text-[#D6AD64]/70">{eyebrow}</p>}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="lifehq-section-title">
            <span aria-hidden="true" />
            <h3 className={titleClassName}>{title}</h3>
          </div>
          {action}
        </div>
        {description && <p className="max-w-2xl text-sm leading-6 text-[#B8B1A7]">{description}</p>}
      </div>
      {children}
    </section>
  );
}


type QuickStat = {
  id: string;
  label: string;
  value: number;
  context: string;
  tone: 'green' | 'gold' | 'blue' | 'muted';
};

const quickStatToneClassNames: Record<QuickStat['tone'], string> = {
  green: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
  gold: 'border-[#D6AD64]/25 bg-[#D6AD64]/10 text-[#F5D28B]',
  blue: 'border-sky-400/20 bg-sky-400/10 text-sky-200',
  muted: 'border-white/10 bg-white/[0.04] text-[#B8B1A7]',
};

function formatTodayPillDate(date = new Date()): string {
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function isOverdueDate(date?: string, today = getTodayDateOnly()): boolean {
  return Boolean(date && date < today);
}

function getQuickStats(projects: Project[], tasks: Task[], milestones: Milestone[], pausedProjects: Project[]): QuickStat[] {
  const overdueProjectCount = projects.filter((project) => project.status !== 'completed' && isOverdueDate(project.targetDate)).length;
  const overdueTaskCount = tasks.filter((task) => task.status !== 'done' && isOverdueDate(task.dueDate)).length;
  const overdueMilestoneCount = milestones.filter((milestone) => milestone.status !== 'done' && isOverdueDate(milestone.targetDate)).length;

  return [
    {
      id: 'active-projects',
      label: 'Aktive Projekte',
      value: projects.filter((project) => project.status === 'active').length,
      context: 'in Bewegung',
      tone: 'green',
    },
    {
      id: 'overdue',
      label: 'Überfällig',
      value: overdueProjectCount + overdueTaskCount + overdueMilestoneCount,
      context: 'aus bestehenden Daten',
      tone: 'gold',
    },
    {
      id: 'open-tasks',
      label: 'Offene Aufgaben',
      value: tasks.filter((task) => task.status !== 'done').length,
      context: 'noch offen',
      tone: 'blue',
    },
    {
      id: 'paused-projects',
      label: 'Pausierte Projekte',
      value: pausedProjects.length,
      context: 'zurückgestellt',
      tone: 'muted',
    },
  ];
}

function QuickStats({ stats }: { stats: QuickStat[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <article key={stat.id} className="lifehq-card-soft flex min-h-24 items-center gap-4 border-white/10 bg-black/15 p-4">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-lg font-semibold ${quickStatToneClassNames[stat.tone]}`} aria-hidden="true">
            {stat.value}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#F5F1EA]">{stat.label}</p>
            <p className="mt-1 text-xs leading-5 text-[#7E776E]">{stat.context}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function MotivationCard() {
  return (
    <aside className="lifehq-premium-card border-[#D6AD64]/25 bg-[#D6AD64]/[0.055] p-5 text-[#F5F1EA] sm:p-6">
      <p className="text-xs uppercase tracking-[0.24em] text-[#D6AD64]/70">Impuls</p>
      <p className="mt-4 font-serif text-xl font-semibold leading-8 tracking-tight sm:text-2xl">Fokussiere dich auf das Wesentliche. Jeden Tag.</p>
    </aside>
  );
}

function ExecutiveCompass() {
  return (
    <div className="relative mx-auto flex h-40 w-40 shrink-0 items-center justify-center rounded-full border border-[#D6AD64]/20 bg-[radial-gradient(circle,rgba(214,173,100,0.16)_0%,rgba(214,173,100,0.04)_46%,rgba(0,0,0,0)_70%)] text-[#D6AD64] shadow-[0_0_55px_rgba(214,173,100,0.12)] sm:h-48 sm:w-48" aria-hidden="true">
      <div className="absolute inset-4 rounded-full border border-[#D6AD64]/15" />
      <div className="absolute inset-9 rounded-full border border-dashed border-[#D6AD64]/20" />
      <span className="absolute top-3 text-[0.65rem] font-semibold tracking-[0.18em] text-[#D6AD64]/70">N</span>
      <span className="absolute bottom-3 text-[0.65rem] font-semibold tracking-[0.18em] text-[#D6AD64]/70">S</span>
      <span className="absolute left-4 text-[0.65rem] font-semibold tracking-[0.18em] text-[#D6AD64]/70">W</span>
      <span className="absolute right-4 text-[0.65rem] font-semibold tracking-[0.18em] text-[#D6AD64]/70">E</span>
      <span className="text-7xl leading-none drop-shadow-[0_0_20px_rgba(214,173,100,0.25)] sm:text-8xl">✦</span>
    </div>
  );
}

function getFocusIcon(priority: FocusPriority): string {
  if (priority === 'High') return '✦';
  if (priority === 'Medium') return '◆';

  return '◇';
}
type AttentionItemType = 'Projekt' | 'Task' | 'Meilenstein' | 'Wiedervorlage';

type AttentionItem = {
  id: string;
  title: string;
  type: AttentionItemType;
  description: string;
  date?: string;
  projectId?: string;
  rank: number;
};

const attentionVisibleLimit = 5;
const getTodayForAttention = () => new Date().toISOString().slice(0, 10);
const isPastOrToday = (date?: string, today = getTodayForAttention()) => Boolean(date && date <= today);

function getAttentionItems(projects: Project[], tasks: Task[], milestones: Milestone[]): AttentionItem[] {
  const today = getTodayForAttention();
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const items: AttentionItem[] = [];

  projects.forEach((project) => {
    if (project.status === 'completed') {
      return;
    }

    const isProjectOverdue = isPastOrToday(project.targetDate, today);

    if (isProjectOverdue && project.priority === 'critical') {
      items.push({
        id: `project-overdue-critical-${project.id}`,
        title: project.name,
        type: 'Projekt',
        description: 'Kritisches Projekt mit erreichtem oder überschrittenem Zieltermin.',
        date: project.targetDate,
        projectId: project.id,
        rank: 1,
      });
      return;
    }

    if (project.trafficLightStatus === 'red') {
      items.push({
        id: `project-red-${project.id}`,
        title: project.name,
        type: 'Projekt',
        description: 'Projekt steht auf roter Ampel.',
        date: project.targetDate,
        projectId: project.id,
        rank: 2,
      });
      return;
    }

    if (project.status === 'paused' && isPastOrToday(project.reviewDate, today)) {
      items.push({
        id: `project-review-${project.id}`,
        title: project.name,
        type: 'Wiedervorlage',
        description: 'Pausiertes Projekt ist zur Wiedervorlage fällig.',
        date: project.reviewDate,
        projectId: project.id,
        rank: 3,
      });
      return;
    }

    if (isProjectOverdue) {
      items.push({
        id: `project-overdue-${project.id}`,
        title: project.name,
        type: 'Projekt',
        description: 'Projekt-Zieltermin ist erreicht oder überschritten.',
        date: project.targetDate,
        projectId: project.id,
        rank: project.priority === 'critical' ? 1 : 6,
      });
      return;
    }

    if (project.priority === 'critical') {
      items.push({
        id: `project-critical-${project.id}`,
        title: project.name,
        type: 'Projekt',
        description: 'Projekt hat kritische Priorität.',
        date: project.targetDate,
        projectId: project.id,
        rank: 6,
      });
    }
  });

  milestones.forEach((milestone) => {
    if (milestone.status === 'done' || !isPastOrToday(milestone.targetDate, today)) {
      return;
    }

    const project = projectById.get(milestone.projectId);

    items.push({
      id: `milestone-overdue-${milestone.id}`,
      title: milestone.title,
      type: 'Meilenstein',
      description: project ? `Meilenstein in ${project.name} ist überfällig.` : 'Meilenstein ist überfällig.',
      date: milestone.targetDate,
      projectId: milestone.projectId,
      rank: 4,
    });
  });

  tasks.forEach((task) => {
    if (task.status === 'done' || !isPastOrToday(task.dueDate, today)) {
      return;
    }

    const project = task.projectId ? projectById.get(task.projectId) : undefined;

    items.push({
      id: `task-overdue-${task.id}`,
      title: task.title,
      type: 'Task',
      description: project ? `Aufgabe in ${project.name} ist überfällig.` : 'Aufgabe ist überfällig.',
      date: task.dueDate,
      rank: 5,
    });
  });

  return items.sort((firstItem, secondItem) => firstItem.rank - secondItem.rank || (firstItem.date ?? '').localeCompare(secondItem.date ?? '') || firstItem.title.localeCompare(secondItem.title));
}

type AttentionVisual = {
  icon: string;
  status: string;
  iconClassName: string;
  badgeClassName: string;
};

function getAttentionVisual(item: AttentionItem): AttentionVisual {
  if (item.date === getTodayForAttention()) {
    return {
      icon: '◷',
      status: 'Heute',
      iconClassName: 'border-sky-400/20 bg-sky-400/10 text-sky-200',
      badgeClassName: 'border-sky-400/25 bg-sky-400/10 text-sky-200',
    };
  }

  if (item.rank === 3) {
    return {
      icon: '↺',
      status: 'Fällig',
      iconClassName: 'border-[#D6AD64]/25 bg-[#D6AD64]/10 text-[#F5D28B]',
      badgeClassName: 'border-[#D6AD64]/25 bg-[#D6AD64]/10 text-[#F5D28B]',
    };
  }

  return {
    icon: item.type === 'Task' ? '□' : item.type === 'Meilenstein' ? '◇' : '!',
    status: item.rank <= 5 ? 'Überfällig' : 'Prüfen',
    iconClassName: item.rank <= 5 ? 'border-red-400/20 bg-red-500/10 text-red-200' : 'border-[#D6AD64]/20 bg-[#D6AD64]/10 text-[#F5D28B]',
    badgeClassName: item.rank <= 5 ? 'border-red-400/25 bg-red-500/10 text-red-100' : 'border-[#D6AD64]/25 bg-[#D6AD64]/10 text-[#F5D28B]',
  };
}

function AttentionList({ items, onProjectSelect }: { items: AttentionItem[]; onProjectSelect: (projectId: string) => void }) {
  if (items.length === 0) {
    return <EmptyState>Keine akuten Punkte benötigen gerade Aufmerksamkeit.</EmptyState>;
  }

  const visibleItems = items.slice(0, attentionVisibleLimit);
  const hiddenItemCount = Math.max(items.length - visibleItems.length, 0);

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        {visibleItems.map((item) => {
          const visual = getAttentionVisual(item);
          const content = (
            <div className="flex min-h-24 items-start gap-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-lg font-semibold ${visual.iconClassName}`} aria-hidden="true">
                {visual.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#B8B1A7]">
                      <span className="lifehq-badge">{item.type}</span>
                      {item.date && <span className="lifehq-badge">{item.date}</span>}
                    </div>
                    <h4 className="mt-2 text-base font-semibold text-[#F5F1EA]">{item.title}</h4>
                    <p className="mt-1 text-sm leading-6 text-[#B8B1A7]">{item.description}</p>
                  </div>
                  <span className={`w-fit shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${visual.badgeClassName}`}>{visual.status}</span>
                </div>
              </div>
            </div>
          );

          if (item.projectId) {
            return (
              <button key={item.id} type="button" onClick={() => onProjectSelect(item.projectId as string)} className="lifehq-card-soft w-full border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.035),rgba(0,0,0,0.14))] p-4 text-left transition hover:border-[#D6AD64]/30 hover:bg-[#D6AD64]/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D6AD64]/60">
                {content}
              </button>
            );
          }

          return (
            <article key={item.id} className="lifehq-card-soft border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.035),rgba(0,0,0,0.14))] p-4">
              {content}
            </article>
          );
        })}
      </div>
      {hiddenItemCount > 0 && (
        <p className="rounded-2xl border border-white/[0.08] bg-black/10 px-4 py-3 text-sm leading-6 text-[#7E776E]">+ {hiddenItemCount} weitere Punkte benötigen Aufmerksamkeit</p>
      )}
    </div>
  );
}

type MomentumCard = {
  id: string;
  value: number;
  title: string;
  context: string;
  icon: string;
};

const getDaysAgoDate = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);

  return date.toISOString().slice(0, 10);
};

const isOnOrAfterDate = (date: string | undefined, boundaryDate: string) => Boolean(date && date.slice(0, 10) >= boundaryDate);

function getMomentumCards(tasks: Task[], projects: Project[], milestones: Milestone[], focuses: Focus[]): MomentumCard[] {
  const thirtyDaysAgo = getDaysAgoDate(30);
  const sevenDaysAgo = getDaysAgoDate(7);
  const completedFocusCount = focuses.filter((focus) => focus.status === 'Completed').length;
  const activeFocusCount = focuses.filter((focus) => focus.status === 'Active').length;

  return [
    {
      id: 'tasks-completed',
      value: tasks.filter((task) => task.status === 'done' && isOnOrAfterDate(task.completedAt, thirtyDaysAgo)).length,
      title: 'Aufgaben erledigt',
      context: 'Letzte 30 Tage',
      icon: '✓',
    },
    {
      id: 'projects-completed',
      value: projects.filter((project) => project.status === 'completed').length,
      title: 'Projekte abgeschlossen',
      context: 'In Bewegung',
      icon: '↗',
    },
    {
      id: 'milestones-completed',
      value: milestones.filter((milestone) => milestone.status === 'done' && isOnOrAfterDate(milestone.completedAt, sevenDaysAgo)).length,
      title: 'Meilensteine erreicht',
      context: 'Letzte 7 Tage',
      icon: '◆',
    },
    {
      id: 'focus-momentum',
      value: completedFocusCount > 0 ? completedFocusCount : activeFocusCount,
      title: completedFocusCount > 0 ? 'Fokus abgeschlossen' : 'Aktive Fokusse',
      context: completedFocusCount > 0 ? 'Starker Fortschritt' : 'Gut im Fluss',
      icon: '✦',
    },
  ];
}

function MomentumCards({ cards }: { cards: MomentumCard[] }) {
  const hasMomentum = cards.some((card) => card.value > 0);

  if (!hasMomentum) {
    return <EmptyState>Noch keine Fortschritte erfasst.</EmptyState>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        {cards.map((card) => (
          <article key={card.id} className="lifehq-premium-card border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(0,0,0,0.16))] p-4 sm:p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#D6AD64]/20 bg-[#D6AD64]/10 text-lg font-semibold text-[#D6AD64]" aria-hidden="true">
                {card.icon}
              </div>
              <div className="min-w-0">
                <p className="font-serif text-4xl font-semibold leading-none tracking-tight text-[#F5F1EA] sm:text-5xl">{card.value}</p>
                <h4 className="mt-3 text-sm font-semibold leading-5 text-[#F5F1EA]">{card.title}</h4>
                <p className="mt-2 text-xs leading-5 text-[#7E776E]">{card.context}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

interface FocusListProps {
  focuses: Focus[];
  trueNorths: TrueNorth[];
  projects: Project[];
  tasks: Task[];
  editingFocusId?: string;
  editDraft: FocusDraft;
  editError?: string;
  onEditStart: (focus: Focus) => void;
  onEditCancel: () => void;
  onEditDraftChange: (patch: Partial<FocusDraft>) => void;
  onEditSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string, status: Exclude<FocusStatus, 'Archived'>) => void;
  onProjectSelect: (projectId: string) => void;
  restoreError?: string;
}

function getTrueNorthTitle(trueNorths: TrueNorth[], trueNorthReference?: string): string | undefined {
  return trueNorths.find((trueNorth) => trueNorth.id === trueNorthReference)?.title;
}

const focusPriorityRank: Record<FocusPriority, number> = { High: 0, Medium: 1, Low: 2 };

function getSortedFocuses(focuses: Focus[]): Focus[] {
  return [...focuses].sort((firstFocus, secondFocus) => {
    const priorityDifference = focusPriorityRank[firstFocus.priority] - focusPriorityRank[secondFocus.priority];

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    return firstFocus.startDate.localeCompare(secondFocus.startDate) || secondFocus.updatedAt.localeCompare(firstFocus.updatedAt);
  });
}

function getFocusProjectContext(focus: Focus, projects: Project[]): { projectCount: number; projectLinks: Pick<Project, 'id' | 'name'>[]; additionalProjectCount: number } {
  const focusProjects = projects.filter((project) => project.focusId === focus.id);
  const projectLinks = focusProjects.slice(0, 2).map((project) => ({ id: project.id, name: project.name }));

  return {
    projectCount: focusProjects.length,
    projectLinks,
    additionalProjectCount: Math.max(focusProjects.length - projectLinks.length, 0),
  };
}

function getFocusOpenTaskCount(focus: Focus, projects: Project[], tasks: Task[]): number {
  const focusProjectIds = new Set(projects.filter((project) => project.focusId === focus.id).map((project) => project.id));

  return tasks.filter((task) => task.status !== 'done' && task.projectId && focusProjectIds.has(task.projectId)).length;
}

function FocusFields({ draft, trueNorths, onChange }: { draft: FocusDraft; trueNorths: TrueNorth[]; onChange: (patch: Partial<FocusDraft>) => void }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <label className="space-y-2 text-sm text-[#B8B1A7] lg:col-span-2">
        <span className="lifehq-label">Titel</span>
        <input value={draft.title} onChange={(event) => onChange({ title: event.target.value })} className="lifehq-crud-control" placeholder="z. B. Gesundheit stabilisieren" />
      </label>
      <label className="space-y-2 text-sm text-[#B8B1A7]">
        <span className="lifehq-label">Status</span>
        <select value={draft.status} onChange={(event) => onChange({ status: event.target.value as FocusStatus })} className="lifehq-crud-control">
          {Object.entries(focusStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label className="space-y-2 text-sm text-[#B8B1A7] lg:col-span-3">
        <span className="lifehq-label">Beschreibung</span>
        <textarea value={draft.description} onChange={(event) => onChange({ description: event.target.value })} className="lifehq-crud-control" rows={3} placeholder="Optionale Einordnung dieses Fokusthemas" />
      </label>
      <label className="space-y-2 text-sm text-[#B8B1A7]">
        <span className="lifehq-label">Priorität</span>
        <select value={draft.priority} onChange={(event) => onChange({ priority: event.target.value as FocusPriority })} className="lifehq-crud-control">
          {Object.entries(focusPriorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label className="space-y-2 text-sm text-[#B8B1A7]">
        <span className="lifehq-label">Startdatum</span>
        <input type="date" value={draft.startDate} onChange={(event) => onChange({ startDate: event.target.value })} className="lifehq-crud-control" />
      </label>
      <label className="space-y-2 text-sm text-[#B8B1A7]">
        <span className="lifehq-label">Zieldatum</span>
        <input type="date" value={draft.targetDate} onChange={(event) => onChange({ targetDate: event.target.value })} className="lifehq-crud-control" />
      </label>
      <label className="space-y-2 text-sm text-[#B8B1A7] lg:col-span-3">
        <span className="lifehq-label">True North Bezug</span>
        <select value={draft.trueNorthReference} onChange={(event) => onChange({ trueNorthReference: event.target.value })} className="lifehq-crud-control">
          <option value="">Ohne True North Bezug</option>
          {trueNorths.map((trueNorth) => <option key={trueNorth.id} value={trueNorth.id}>{trueNorth.title}</option>)}
        </select>
      </label>
    </div>
  );
}

function FocusList({ focuses, trueNorths, projects, tasks, editingFocusId, editDraft, editError, onEditStart, onEditCancel, onEditDraftChange, onEditSubmit, onArchive, onRestore, onProjectSelect, restoreError }: FocusListProps) {
  const activeFocuses = getSortedFocuses(focuses.filter((focus) => focus.status === 'Active'));
  const pausedFocuses = getSortedFocuses(focuses.filter((focus) => focus.status === 'Paused'));
  const completedFocuses = getSortedFocuses(focuses.filter((focus) => focus.status === 'Completed'));
  const archivedFocuses = getSortedFocuses(focuses.filter((focus) => focus.status === 'Archived'));
  const hasNonArchivedFocuses = activeFocuses.length > 0 || pausedFocuses.length > 0 || completedFocuses.length > 0;

  if (focuses.length === 0) {
    return <EmptyState>Lege deinen ersten aktuellen Fokus fest.</EmptyState>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#D6AD64]/70">Orientierung</p>
            <h4 className="mt-2 font-serif text-2xl font-semibold tracking-tight text-[#F5F1EA]">Aktive Fokusse</h4>
          </div>
          <p className="max-w-md text-sm leading-6 text-[#7E776E]">Worauf sollte aktuell der größte Teil deiner Aufmerksamkeit liegen?</p>
        </div>

        {activeFocuses.length === 0 ? (
          <EmptyState>Lege deinen ersten aktuellen Fokus fest.</EmptyState>
        ) : (
          <div className="grid gap-4 2xl:grid-cols-2">
            {activeFocuses.map((focus) => {
              const isEditing = editingFocusId === focus.id;
              const trueNorthTitle = getTrueNorthTitle(trueNorths, focus.trueNorthReference);
              const projectContext = getFocusProjectContext(focus, projects);
              const openTaskCount = getFocusOpenTaskCount(focus, projects, tasks);

              return (
                <article key={focus.id} className="lifehq-premium-card overflow-hidden border-[#D6AD64]/30 bg-[linear-gradient(135deg,rgba(214,173,100,0.095),rgba(255,255,255,0.025)_42%,rgba(0,0,0,0.16))] p-0 shadow-[0_28px_90px_rgba(0,0,0,0.28)]">
                  {isEditing ? (
                    <form onSubmit={onEditSubmit} className="space-y-4 p-4 sm:p-6">
                      <FocusFields draft={editDraft} trueNorths={trueNorths} onChange={onEditDraftChange} />
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {editError ? <p className="text-sm text-[#D6AD64]">{editError}</p> : <p className="text-sm text-[#7E776E]">Maximal fünf aktive Fokusse möglich.</p>}
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={onEditCancel} className="lifehq-button-secondary">Abbrechen</button>
                          <button type="submit" className="lifehq-button-primary">Speichern</button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <div className="flex h-full flex-col justify-between gap-6 p-4 sm:p-6">
                      <div className="space-y-5">
                        <div className="flex items-start gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#D6AD64]/20 bg-[#D6AD64]/10 text-2xl text-[#D6AD64] shadow-[0_0_30px_rgba(214,173,100,0.10)]" aria-hidden="true">
                            {getFocusIcon(focus.priority)}
                          </div>
                          <div className="min-w-0 flex-1 space-y-3">
                            <div className="flex flex-wrap gap-2 text-xs text-[#B8B1A7]">
                              <span className="lifehq-badge">{focusStatusLabels[focus.status]}</span>
                              <span className="lifehq-badge">Priorität: {focusPriorityLabels[focus.priority]}</span>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-serif text-2xl font-semibold tracking-tight text-[#F5F1EA] sm:text-3xl">{focus.title}</h4>
                              {focus.description && <p className="text-sm leading-6 text-[#B8B1A7]">{focus.description}</p>}
                            </div>
                          </div>
                        </div>
                        <div className="grid gap-3 text-sm leading-6 sm:grid-cols-3">
                          <div className="rounded-2xl border border-white/[0.08] bg-black/15 p-3">
                            <p className="lifehq-label">Projekte</p>
                            <p className="mt-1 text-lg font-semibold text-[#F5F1EA]">{projectContext.projectCount}</p>
                          </div>
                          <div className="rounded-2xl border border-white/[0.08] bg-black/15 p-3">
                            <p className="lifehq-label">Aufgaben</p>
                            <p className="mt-1 text-lg font-semibold text-[#F5F1EA]">{openTaskCount}</p>
                          </div>
                          <div className="rounded-2xl border border-white/[0.08] bg-black/15 p-3">
                            <p className="lifehq-label">Zieldatum</p>
                            <p className="mt-1 text-sm font-semibold text-[#F5F1EA]">{focus.targetDate ?? 'Offen'}</p>
                          </div>
                        </div>
                        <div className="grid gap-2 text-xs leading-5 text-[#7E776E] sm:grid-cols-2">
                          <p>Start: {focus.startDate}</p>
                          <p className="sm:text-right">Richtung: {trueNorthTitle ?? 'Keine Richtung zugeordnet'}</p>
                        </div>
                        <div className="rounded-3xl border border-white/10 bg-black/15 px-4 py-4 text-sm leading-6 text-[#B8B1A7]">
                          <p className="font-medium text-[#F5F1EA]">
                            {projectContext.projectCount === 0 ? 'Noch keine Projekte zugeordnet.' : 'Projektkontext'}
                          </p>
                          {projectContext.projectLinks.length > 0 && (
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#7E776E]">
                              {projectContext.projectLinks.map((projectLink) => (
                                <button
                                  key={projectLink.id}
                                  type="button"
                                  onClick={() => onProjectSelect(projectLink.id)}
                                  className="min-h-10 rounded-full border border-[#D6AD64]/15 bg-[#D6AD64]/[0.045] px-3 py-2 text-[#D8C8AF] transition hover:border-[#D6AD64]/35 hover:text-[#F5F1EA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D6AD64]/60"
                                >
                                  {projectLink.name}
                                </button>
                              ))}
                              {projectContext.additionalProjectCount > 0 && <span>+ {projectContext.additionalProjectCount} weitere</span>}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 border-t border-white/[0.08] pt-4 sm:flex-row sm:flex-wrap">
                        <button type="button" onClick={() => onEditStart(focus)} className="lifehq-button-secondary w-full sm:w-auto">Bearbeiten</button>
                        <button type="button" onClick={() => onArchive(focus.id)} className="lifehq-button-secondary w-full sm:w-auto">Archivieren</button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {hasNonArchivedFocuses && (pausedFocuses.length > 0 || completedFocuses.length > 0) && (
        <div className="space-y-4 border-t border-white/[0.08] pt-5">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#D6AD64]/60">Management</p>
            <h4 className="mt-2 text-lg font-semibold tracking-tight text-[#F5F1EA]">Pausierte und abgeschlossene Fokusse</h4>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {[...pausedFocuses, ...completedFocuses].map((focus) => {
              const isEditing = editingFocusId === focus.id;
              const trueNorthTitle = getTrueNorthTitle(trueNorths, focus.trueNorthReference);
              const projectContext = getFocusProjectContext(focus, projects);

              return (
                <article key={focus.id} className="lifehq-card-soft border-white/10 bg-black/10 p-4 text-sm text-[#B8B1A7]">
                  {isEditing ? (
                    <form onSubmit={onEditSubmit} className="space-y-4">
                      <FocusFields draft={editDraft} trueNorths={trueNorths} onChange={onEditDraftChange} />
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {editError ? <p className="text-sm text-[#D6AD64]">{editError}</p> : <p className="text-sm text-[#7E776E]">Status und Priorität bleiben änderbar.</p>}
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={onEditCancel} className="lifehq-button-secondary">Abbrechen</button>
                          <button type="submit" className="lifehq-button-primary">Speichern</button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="lifehq-badge">{focusStatusLabels[focus.status]}</span>
                        <span className="lifehq-badge">Priorität: {focusPriorityLabels[focus.priority]}</span>
                      </div>
                      <h5 className="text-base font-semibold text-[#F5F1EA]">{focus.title}</h5>
                      {focus.description && <p className="line-clamp-2 leading-6">{focus.description}</p>}
                      <p className="text-xs text-[#7E776E]">Richtung: {trueNorthTitle ?? 'Keine Richtung zugeordnet'}</p>
                      <p className="text-xs text-[#7E776E]">{projectContext.projectCount === 0 ? 'Noch keine Projekte zugeordnet.' : `${projectContext.projectCount} zugeordnete Projekte`}</p>
                      <div className="flex flex-wrap gap-2 border-t border-white/[0.08] pt-3">
                        <button type="button" onClick={() => onEditStart(focus)} className="lifehq-button-secondary">Bearbeiten</button>
                        <button type="button" onClick={() => onArchive(focus.id)} className="lifehq-button-secondary">Archivieren</button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}

      {archivedFocuses.length > 0 && (
        <details className="lifehq-card-soft border-white/10 bg-black/10 px-4 py-3 text-sm text-[#B8B1A7]">
          <summary className="cursor-pointer font-medium text-[#F5F1EA]">Archivierte Fokusse ({archivedFocuses.length})</summary>
          <div className="mt-4 space-y-4">
            {restoreError && <p className="text-sm text-[#D6AD64]">{restoreError}</p>}
            {archivedFocuses.map((focus) => {
              const isEditing = editingFocusId === focus.id;
              const trueNorthTitle = getTrueNorthTitle(trueNorths, focus.trueNorthReference);

              return (
                <article key={focus.id} className="lifehq-card-soft border-white/10 bg-black/15 p-4">
                  {isEditing ? (
                    <form onSubmit={onEditSubmit} className="space-y-4">
                      <FocusFields draft={editDraft} trueNorths={trueNorths} onChange={onEditDraftChange} />
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {editError ? <p className="text-sm text-[#D6AD64]">{editError}</p> : <p className="text-sm text-[#7E776E]">Archivierte Fokusse können auf Active, Paused oder Completed zurückgeführt werden.</p>}
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={onEditCancel} className="lifehq-button-secondary">Abbrechen</button>
                          <button type="submit" className="lifehq-button-primary">Speichern</button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-[#D6AD64]/60">Archiviert</p>
                          <h4 className="mt-1 text-base font-semibold text-[#F5F1EA]">{focus.title}</h4>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="lifehq-badge">Priorität: {focusPriorityLabels[focus.priority]}</span>
                        </div>
                      </div>
                      {focus.description && <p className="text-sm leading-6 text-[#B8B1A7]">{focus.description}</p>}
                      <p className="text-xs leading-5 text-[#7E776E]">True North: {trueNorthTitle ?? 'Nicht zugeordnet'}</p>
                      <div className="flex flex-wrap gap-2 border-t border-white/[0.08] pt-3">
                        <button type="button" onClick={() => onRestore(focus.id, 'Active')} className="lifehq-button-primary">Wiederherstellen</button>
                        <button type="button" onClick={() => onRestore(focus.id, 'Paused')} className="lifehq-button-secondary">Als pausiert setzen</button>
                        <button type="button" onClick={() => onRestore(focus.id, 'Completed')} className="lifehq-button-secondary">Als abgeschlossen setzen</button>
                        <button type="button" onClick={() => onEditStart(focus)} className="lifehq-button-secondary">Bearbeiten</button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
}

interface TrueNorthListProps {
  trueNorths: TrueNorth[];
  editingTrueNorthId?: string;
  editDraft: TrueNorthDraft;
  editError?: string;
  onEditStart: (trueNorth: TrueNorth) => void;
  onEditCancel: () => void;
  onEditDraftChange: (patch: Partial<TrueNorthDraft>) => void;
  onEditSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDelete: (id: string) => void;
}

function TrueNorthList({ trueNorths, editingTrueNorthId, editDraft, editError, onEditStart, onEditCancel, onEditDraftChange, onEditSubmit, onDelete }: TrueNorthListProps) {
  if (trueNorths.length === 0) {
    return <EmptyState>Definiere die langfristige Richtung deines Lebens.</EmptyState>;
  }

  return (
    <div className="space-y-5">
      {trueNorths.map((trueNorth) => {
        const isEditing = editingTrueNorthId === trueNorth.id;

        return (
          <article key={trueNorth.id} className="lifehq-premium-card overflow-hidden border-[#D6AD64]/25 bg-[linear-gradient(135deg,rgba(214,173,100,0.11),rgba(255,255,255,0.025)_46%,rgba(0,0,0,0.20))] p-0 shadow-[0_28px_90px_rgba(0,0,0,0.30)]">
            {isEditing ? (
              <form onSubmit={onEditSubmit} className="space-y-4 p-4 sm:p-6">
                <label className="space-y-2 text-sm text-[#B8B1A7]">
                  <span className="lifehq-label">Titel</span>
                  <input value={editDraft.title} onChange={(event) => onEditDraftChange({ title: event.target.value })} className="lifehq-crud-control" placeholder="Langfristige Richtung" />
                </label>
                <label className="space-y-2 text-sm text-[#B8B1A7]">
                  <span className="lifehq-label">Beschreibung</span>
                  <textarea value={editDraft.description} onChange={(event) => onEditDraftChange({ description: event.target.value })} className="lifehq-crud-control" rows={3} placeholder="Optionale Beschreibung" />
                </label>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {editError ? <p className="text-sm text-[#D6AD64]">{editError}</p> : <p className="text-sm text-[#7E776E]">Selten ändern, bewusst formulieren.</p>}
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={onEditCancel} className="lifehq-button-secondary">Abbrechen</button>
                    <button type="submit" className="lifehq-button-primary">Speichern</button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="min-w-0 space-y-5">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.28em] text-[#D6AD64]/75">True North</p>
                    <h4 className="font-serif text-3xl font-semibold leading-tight tracking-tight text-[#F5F1EA] sm:text-4xl lg:text-5xl">{trueNorth.title}</h4>
                    {trueNorth.description && <p className="max-w-2xl text-base leading-7 text-[#D8C8AF]">{trueNorth.description}</p>}
                  </div>
                  <p className="max-w-xl text-sm leading-6 text-[#7E776E]">Langfristige Richtung deines Lebens.</p>
                  <div className="flex flex-wrap gap-2 border-t border-white/[0.08] pt-4">
                    <button type="button" onClick={() => onEditStart(trueNorth)} className="lifehq-button-secondary">Bearbeiten</button>
                    <button type="button" onClick={() => onDelete(trueNorth.id)} className="lifehq-button-secondary">Löschen</button>
                  </div>
                </div>
                <ExecutiveCompass />
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="lifehq-empty-state border-white/10 bg-white/[0.025]">
      <p className="font-medium text-[#B8B1A7]">Bereit für Einordnung</p>
      <p className="mt-1 text-[#7E776E]">{children}</p>
    </div>
  );
}

function getLifeAreaSymbol(lifeAreaName: string): string {
  const normalizedName = lifeAreaName.toLowerCase();

  if (normalizedName.includes('health') || normalizedName.includes('gesund')) {
    return '♡';
  }

  if (normalizedName.includes('career') || normalizedName.includes('karriere') || normalizedName.includes('work')) {
    return '▣';
  }

  if (normalizedName.includes('finance') || normalizedName.includes('finanz')) {
    return '▥';
  }

  if (normalizedName.includes('relationship') || normalizedName.includes('beziehung')) {
    return '♁';
  }

  if (normalizedName.includes('home') || normalizedName.includes('zuhause')) {
    return '⌂';
  }

  if (normalizedName.includes('personal') || normalizedName.includes('entwicklung')) {
    return '◇';
  }

  return '✦';
}

function getLifeAreaDisplayName(lifeAreaName: string): string {
  const normalizedName = lifeAreaName.toLowerCase();

  if (normalizedName.includes('health') || normalizedName.includes('gesund')) {
    return 'Gesundheit';
  }

  if (normalizedName.includes('career') || normalizedName.includes('karriere')) {
    return 'Karriere';
  }

  if (normalizedName.includes('finance') || normalizedName.includes('finanz')) {
    return 'Finanzen';
  }

  if (normalizedName.includes('relationship') || normalizedName.includes('beziehung')) {
    return 'Beziehungen';
  }

  if (normalizedName.includes('personal development') || normalizedName.includes('entwicklung')) {
    return 'Persönliche Entwicklung';
  }

  if (normalizedName.includes('home') || normalizedName.includes('zuhause')) {
    return 'Zuhause';
  }

  if (normalizedName.includes('family') || normalizedName.includes('familie')) {
    return 'Familie';
  }

  if (normalizedName.includes('business')) {
    return 'Business';
  }

  if (normalizedName.includes('work') || normalizedName.includes('arbeit')) {
    return 'Arbeit';
  }

  if (normalizedName.includes('sport')) {
    return 'Sport';
  }

  if (normalizedName.includes('nutrition') || normalizedName.includes('ernährung')) {
    return 'Ernährung';
  }

  return lifeAreaName;
}

function getLifeAreaDisplayDescription(lifeArea: LifeArea): string {
  if (lifeArea.description) return lifeArea.description;

  const normalizedName = lifeArea.name.toLowerCase();

  if (normalizedName.includes('health') || normalizedName.includes('gesund')) {
    return 'Stärke deinen Körper und Geist.';
  }

  if (normalizedName.includes('career') || normalizedName.includes('karriere')) {
    return 'Wachse professionell und gestalte Wirkung.';
  }

  if (normalizedName.includes('finance') || normalizedName.includes('finanz')) {
    return 'Schaffe Klarheit und finanzielle Freiheit.';
  }

  if (normalizedName.includes('relationship') || normalizedName.includes('beziehung')) {
    return 'Pflege echte Verbindungen.';
  }

  if (normalizedName.includes('personal development') || normalizedName.includes('entwicklung')) {
    return 'Lerne, reflektiere und wachse.';
  }

  if (normalizedName.includes('home') || normalizedName.includes('zuhause')) {
    return 'Gestalte dein Umfeld bewusst und harmonisch.';
  }

  return lifeArea.description ?? 'Dieser Lebensbereich ist bereit für deine nächsten strategischen Vorhaben.';
}

function getProjectLabel(projectCount: number): string {
  if (projectCount === 0) {
    return 'Keine Projekte';
  }

  return projectCount === 1 ? '1 Projekt' : `${projectCount} Projekte`;
}

function getOpenTaskLabel(openTaskCount: number): string {
  if (openTaskCount === 0) {
    return 'Keine offenen Aufgaben';
  }

  return openTaskCount === 1 ? '1 offene Aufgabe' : `${openTaskCount} offene Aufgaben`;
}

interface LifeAreaListProps {
  lifeAreas: LifeArea[];
  projects: Project[];
  tasks: Task[];
  criticalProjects: Project[];
  onLifeAreaSelect: (lifeAreaId: string) => void;
}

function LifeAreaList({ lifeAreas, projects, tasks, criticalProjects, onLifeAreaSelect }: LifeAreaListProps) {
  if (lifeAreas.length === 0) {
    return <EmptyState>Baue Schritt für Schritt dein persönliches HQ auf.</EmptyState>;
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {lifeAreas.map((lifeArea) => {
        const areaProjects = projects.filter((project) => project.lifeAreaId === lifeArea.id);
        const areaProjectIds = new Set(areaProjects.map((project) => project.id));
        const areaDirectOpenTasks = tasks.filter((task) => task.status !== 'done' && task.lifeAreaId === lifeArea.id && !task.projectId);
        const areaOpenTasks = tasks.filter((task) => task.status !== 'done' && (task.lifeAreaId === lifeArea.id || (task.projectId ? areaProjectIds.has(task.projectId) : false)));
        const areaAttentionProjects = criticalProjects.filter((project) => project.lifeAreaId === lifeArea.id);
        const needsAttention = areaAttentionProjects.length > 0;

        return (
          <button
            key={lifeArea.id}
            type="button"
            onClick={() => onLifeAreaSelect(lifeArea.id)}
            className="lifehq-domain-card group flex min-h-[13rem] flex-col justify-between p-6 text-left sm:p-7"
            aria-label={`Lebensbereich ${getLifeAreaDisplayName(lifeArea.name)} öffnen`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="lifehq-gold-icon-frame" aria-hidden="true">
                {getLifeAreaSymbol(lifeArea.name)}
              </div>
              <span className="text-xl leading-none text-[#D6AD64]/65 transition-transform group-hover:translate-x-1" aria-hidden="true">›</span>
            </div>

            <div className="mt-6 space-y-3">
              <h4 className="font-serif text-2xl font-semibold tracking-tight text-[#F5F1EA]">{getLifeAreaDisplayName(lifeArea.name)}</h4>
              <p className="line-clamp-2 min-h-12 text-sm leading-6 text-[#B8B1A7]">
                {getLifeAreaDisplayDescription(lifeArea)}
              </p>
            </div>

            <div className="mt-6 border-t border-white/[0.08] pt-4">
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-[0.82rem] leading-5 text-[#B8B1A7]">
                <span>{getProjectLabel(areaProjects.length)}</span>
                <span>{getOpenTaskLabel(areaOpenTasks.length)}</span>
                {areaDirectOpenTasks.length > 0 && <span>{areaDirectOpenTasks.length} direkt im Bereich</span>}
              </div>
              {needsAttention && (
                <p className="mt-3 flex items-center gap-2 text-xs text-[#D6AD64]/85">
                  <span className="h-2 w-2 rounded-full bg-[#D6AD64] shadow-[0_0_18px_rgba(214,173,100,0.35)]" aria-hidden="true" />
                  Bitte prüfen
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

interface ActiveProjectPreviewProps {
  projects: Project[];
  tasks: Task[];
  onProjectSelect: (projectId: string) => void;
}

function ActiveProjectPreview({ projects, tasks, onProjectSelect }: ActiveProjectPreviewProps) {
  const previewProjects = projects.slice(0, 4);
  const hiddenProjectCount = Math.max(projects.length - previewProjects.length, 0);

  if (projects.length === 0) {
    return <EmptyState>Keine aktiven Projekte für die Vertiefung vorhanden.</EmptyState>;
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {previewProjects.map((project) => {
          const openTaskCount = tasks.filter((task) => task.projectId === project.id && task.status !== 'done').length;

          return (
            <button key={project.id} type="button" onClick={() => onProjectSelect(project.id)} className="lifehq-card-soft min-h-28 border-white/10 bg-black/15 p-4 text-left transition hover:border-[#D6AD64]/25 hover:bg-[#D6AD64]/[0.035] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D6AD64]/60">
              <p className="lifehq-label">Aktives Projekt</p>
              <h4 className="mt-3 line-clamp-2 text-base font-semibold text-[#F5F1EA]">{project.name}</h4>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#B8B1A7]">
                <span className="lifehq-badge">{projectStatusLabels[project.status]}</span>
                <span className="lifehq-badge">{getOpenTaskLabel(openTaskCount)}</span>
              </div>
            </button>
          );
        })}
      </div>
      {hiddenProjectCount > 0 && <p className="text-sm leading-6 text-[#7E776E]">+ {hiddenProjectCount} weitere aktive Projekte bleiben über Lebensbereiche erreichbar.</p>}
    </div>
  );
}

interface DeepDiveQuickLinksProps {
  projects: Project[];
  onProjectSelect: (projectId: string) => void;
  onTasksOpen: () => void;
}

function DeepDiveQuickLinks({ projects, onProjectSelect, onTasksOpen }: DeepDiveQuickLinksProps) {
  const firstProject = projects[0];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <button type="button" onClick={() => firstProject ? onProjectSelect(firstProject.id) : undefined} disabled={!firstProject} className="lifehq-card-soft min-h-28 border-white/10 bg-black/15 p-4 text-left transition enabled:hover:border-[#D6AD64]/25 enabled:hover:bg-[#D6AD64]/[0.035] disabled:opacity-60">
        <p className="lifehq-label">Projekte</p>
        <h4 className="mt-2 text-base font-semibold text-[#F5F1EA]">Projektansicht öffnen</h4>
        <p className="mt-2 text-sm leading-6 text-[#7E776E]">{firstProject ? 'Springe in ein bestehendes Projekt.' : 'Noch kein Projekt vorhanden.'}</p>
      </button>
      <button type="button" onClick={onTasksOpen} className="lifehq-card-soft min-h-28 border-white/10 bg-black/15 p-4 text-left transition hover:border-[#D6AD64]/25 hover:bg-[#D6AD64]/[0.035] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D6AD64]/60">
        <p className="lifehq-label">Tasks</p>
        <h4 className="mt-2 text-base font-semibold text-[#F5F1EA]">Aufgaben öffnen</h4>
        <p className="mt-2 text-sm leading-6 text-[#7E776E]">Wechsle in die bestehende Aufgabenansicht.</p>
      </button>
      <div className="lifehq-card-soft min-h-28 border-white/10 bg-black/10 p-4 text-left opacity-70">
        <p className="lifehq-label">Kalender</p>
        <h4 className="mt-2 text-base font-semibold text-[#F5F1EA]">Noch keine Kalenderroute</h4>
        <p className="mt-2 text-sm leading-6 text-[#7E776E]">Es wird keine neue Navigation ergänzt.</p>
      </div>
    </div>
  );
}

interface OrphanProjectListProps {
  projects: Project[];
  tasks: ReturnType<typeof selectTasks>;
  onProjectSelect: (projectId: string) => void;
  action?: ReactNode;
  children?: ReactNode;
}

function OrphanProjectList({ projects, tasks, onProjectSelect, action, children }: OrphanProjectListProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="lifehq-section-title">
          <span aria-hidden="true" />
          <h3 className="font-serif text-xl font-semibold tracking-tight text-[#F5F1EA]">Projekte ohne Lebensbereich</h3>
        </div>
        {action}
      </div>
      {children}
      {projects.length === 0 ? (
        <EmptyState>Neue Projekte können hier bewusst ohne Lebensbereich starten.</EmptyState>
      ) : (
      <div className="lifehq-unassigned-project-grid">
        {projects.map((project) => {
          const projectOpenTaskCount = tasks.filter((task) => task.projectId === project.id && task.status !== 'done').length;

          return (
            <button key={project.id} type="button" onClick={() => onProjectSelect(project.id)} className="lifehq-unassigned-project-card group flex flex-col items-start gap-4 p-4 text-left sm:flex-row sm:items-center sm:p-6">
              <div className="lifehq-gold-icon-frame shrink-0" aria-hidden="true">◎</div>
              <div className="min-w-0 flex-1">
                <h4 className="text-base font-semibold text-[#F5F1EA]">{project.name}</h4>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#B8B1A7]">{project.description ?? 'Übergeordnete Planung und Ausrichtung.'}</p>
              </div>
              <div className="hidden text-right text-xs leading-5 text-[#7E776E] sm:block">
                <p>{getOpenTaskLabel(projectOpenTaskCount)}</p>
                {(project.priority === 'critical' || project.trafficLightStatus === 'red') && <p className="text-[#D6AD64]/80">Bitte prüfen</p>}
              </div>
              <span className="text-2xl text-[#D6AD64]/65 transition-transform group-hover:translate-x-1" aria-hidden="true">›</span>
            </button>
          );
        })}
      </div>
      )}
    </section>
  );
}

export function HqPage() {
  const navigate = useNavigate();
  const focuses = useLifeHQStore(selectFocuses);
  const trueNorths = useLifeHQStore(selectTrueNorths);
  const lifeAreas = useLifeHQStore(selectLifeAreas);
  const activeProjects = useLifeHQStore(selectActiveProjects);
  const plannedProjects = useLifeHQStore(selectPlannedProjects);
  const pausedProjects = useLifeHQStore(selectPausedProjects);
  const completedProjects = useLifeHQStore(selectCompletedProjects);
  const criticalProjects = useLifeHQStore(selectCriticalProjects);
  const tasks = useLifeHQStore(selectTasks);
  const milestones = useLifeHQStore(selectMilestones);
  const createFocus = useLifeHQStore((state) => state.createFocus);
  const updateFocus = useLifeHQStore((state) => state.updateFocus);
  const archiveFocus = useLifeHQStore((state) => state.archiveFocus);
  const addTrueNorth = useLifeHQStore((state) => state.addTrueNorth);
  const updateTrueNorth = useLifeHQStore((state) => state.updateTrueNorth);
  const deleteTrueNorth = useLifeHQStore((state) => state.deleteTrueNorth);
  const addLifeArea = useLifeHQStore((state) => state.addLifeArea);
  const addProject = useLifeHQStore((state) => state.addProject);
  const [isFocusFormOpen, setIsFocusFormOpen] = useState(false);
  const [focusDraft, setFocusDraft] = useState<FocusDraft>(createDefaultFocusDraft);
  const [focusError, setFocusError] = useState<string | undefined>();
  const [editingFocusId, setEditingFocusId] = useState<string | undefined>();
  const [focusEditDraft, setFocusEditDraft] = useState<FocusDraft>(createDefaultFocusDraft);
  const [focusEditError, setFocusEditError] = useState<string | undefined>();
  const [focusRestoreError, setFocusRestoreError] = useState<string | undefined>();
  const [isTrueNorthFormOpen, setIsTrueNorthFormOpen] = useState(false);
  const [trueNorthDraft, setTrueNorthDraft] = useState<TrueNorthDraft>(defaultTrueNorthDraft);
  const [trueNorthError, setTrueNorthError] = useState<string | undefined>();
  const [editingTrueNorthId, setEditingTrueNorthId] = useState<string | undefined>();
  const [trueNorthEditDraft, setTrueNorthEditDraft] = useState<TrueNorthDraft>(defaultTrueNorthDraft);
  const [trueNorthEditError, setTrueNorthEditError] = useState<string | undefined>();
  const [isLifeAreaFormOpen, setIsLifeAreaFormOpen] = useState(false);
  const [lifeAreaDraft, setLifeAreaDraft] = useState<LifeAreaDraft>(defaultLifeAreaDraft);
  const [lifeAreaError, setLifeAreaError] = useState<string | undefined>();
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [projectDraft, setProjectDraft] = useState<ProjectDraft>(defaultProjectDraft);
  const [projectError, setProjectError] = useState<string | undefined>();
  const allStatusProjects = [...activeProjects, ...plannedProjects, ...pausedProjects, ...completedProjects];
  const existingLifeAreaIds = new Set(lifeAreas.map((lifeArea) => lifeArea.id));
  const orphanProjects = allStatusProjects.filter((project) => {
    const lifeAreaId = project.lifeAreaId?.trim();

    return !lifeAreaId || !existingLifeAreaIds.has(lifeAreaId);
  });
  const selectableFocuses = focuses.filter((focus) => focus.status !== 'Archived');
  const attentionItems = getAttentionItems(allStatusProjects, tasks, milestones);
  const momentumCards = getMomentumCards(tasks, allStatusProjects, milestones, focuses);
  const quickStats = getQuickStats(allStatusProjects, tasks, milestones, pausedProjects);
  const todayPillDate = formatTodayPillDate();

  const openProjectDetail = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  const openLifeAreaDetail = (lifeAreaId: string) => {
    navigate(`/life-areas/${lifeAreaId}`);
  };

  const openTasks = () => {
    navigate('/tasks');
  };

  function getActiveFocusCount(excludedFocusId?: string) {
    return focuses.filter((focus) => focus.status === 'Active' && focus.id !== excludedFocusId).length;
  }

  function getFocusLimitError(draft: FocusDraft, excludedFocusId?: string): string | undefined {
    if (draft.status === 'Active' && getActiveFocusCount(excludedFocusId) >= 5) {
      return 'Maximal fünf aktive Fokusse möglich. Archiviere oder pausiere zuerst einen bestehenden Fokus.';
    }

    return undefined;
  }

  function getFocusPatchFromDraft(draft: FocusDraft) {
    return {
      title: draft.title.trim(),
      description: getOptionalFormValue(draft.description),
      status: draft.status,
      priority: draft.priority,
      startDate: draft.startDate,
      targetDate: draft.targetDate || undefined,
      trueNorthReference: getOptionalFormValue(draft.trueNorthReference),
    };
  }

  function toggleFocusForm() {
    setIsFocusFormOpen((current) => !current);
    setEditingFocusId(undefined);
    setFocusEditError(undefined);
  }

  function updateFocusDraft(patch: Partial<FocusDraft>) {
    setFocusDraft((current) => ({ ...current, ...patch }));
    setFocusError(undefined);
    setFocusRestoreError(undefined);
  }

  function resetFocusDraft() {
    setFocusDraft(createDefaultFocusDraft());
    setFocusError(undefined);
  }

  function handleCreateFocus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = focusDraft.title.trim();

    if (!title) {
      setFocusError('Bitte gib einen Titel ein.');
      return;
    }

    if (!focusDraft.startDate) {
      setFocusError('Bitte wähle ein Startdatum.');
      return;
    }

    const limitError = getFocusLimitError(focusDraft);

    if (limitError) {
      setFocusError(limitError);
      return;
    }

    const timestamp = new Date().toISOString();

    createFocus({
      id: createEntityId('f'),
      ...getFocusPatchFromDraft(focusDraft),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    resetFocusDraft();
    setIsFocusFormOpen(false);
  }

  function startEditingFocus(focus: Focus) {
    setEditingFocusId(focus.id);
    setFocusEditDraft({
      title: focus.title,
      description: focus.description ?? '',
      status: focus.status,
      priority: focus.priority,
      startDate: focus.startDate,
      targetDate: focus.targetDate ?? '',
      trueNorthReference: focus.trueNorthReference ?? '',
    });
    setFocusEditError(undefined);
    setFocusRestoreError(undefined);
    setIsFocusFormOpen(false);
  }

  function updateFocusEditDraft(patch: Partial<FocusDraft>) {
    setFocusEditDraft((current) => ({ ...current, ...patch }));
    setFocusEditError(undefined);
    setFocusRestoreError(undefined);
  }

  function cancelEditingFocus() {
    setEditingFocusId(undefined);
    setFocusEditDraft(createDefaultFocusDraft());
    setFocusEditError(undefined);
    setFocusRestoreError(undefined);
  }

  function handleUpdateFocus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingFocusId) {
      return;
    }

    const title = focusEditDraft.title.trim();

    if (!title) {
      setFocusEditError('Bitte gib einen Titel ein.');
      return;
    }

    if (!focusEditDraft.startDate) {
      setFocusEditError('Bitte wähle ein Startdatum.');
      return;
    }

    const limitError = getFocusLimitError(focusEditDraft, editingFocusId);

    if (limitError) {
      setFocusEditError(limitError);
      return;
    }

    updateFocus(editingFocusId, getFocusPatchFromDraft(focusEditDraft));
    cancelEditingFocus();
  }

  function handleArchiveFocus(id: string) {
    archiveFocus(id);
    setFocusRestoreError(undefined);

    if (editingFocusId === id) {
      cancelEditingFocus();
    }
  }

  function handleRestoreFocus(id: string, status: Exclude<FocusStatus, 'Archived'>) {
    if (status === 'Active' && getActiveFocusCount(id) >= 5) {
      setFocusRestoreError('Maximal fünf aktive Fokusse möglich. Archiviere oder pausiere zuerst einen bestehenden Fokus.');
      return;
    }

    updateFocus(id, { status });
    setFocusRestoreError(undefined);

    if (editingFocusId === id) {
      cancelEditingFocus();
    }
  }

  function toggleTrueNorthForm() {
    setIsTrueNorthFormOpen((current) => !current);
    setEditingTrueNorthId(undefined);
    setTrueNorthEditError(undefined);
  }

  function updateTrueNorthDraft(patch: Partial<TrueNorthDraft>) {
    setTrueNorthDraft((current) => ({ ...current, ...patch }));
    setTrueNorthError(undefined);
  }

  function resetTrueNorthDraft() {
    setTrueNorthDraft(defaultTrueNorthDraft);
    setTrueNorthError(undefined);
  }

  function handleCreateTrueNorth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = trueNorthDraft.title.trim();

    if (!title) {
      setTrueNorthError('Bitte gib einen Titel ein.');
      return;
    }

    const timestamp = new Date().toISOString();

    addTrueNorth({
      id: createEntityId('tn'),
      title,
      description: getOptionalFormValue(trueNorthDraft.description),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    resetTrueNorthDraft();
    setIsTrueNorthFormOpen(false);
  }

  function startEditingTrueNorth(trueNorth: TrueNorth) {
    setEditingTrueNorthId(trueNorth.id);
    setTrueNorthEditDraft({ title: trueNorth.title, description: trueNorth.description ?? '' });
    setTrueNorthEditError(undefined);
    setIsTrueNorthFormOpen(false);
  }

  function updateTrueNorthEditDraft(patch: Partial<TrueNorthDraft>) {
    setTrueNorthEditDraft((current) => ({ ...current, ...patch }));
    setTrueNorthEditError(undefined);
  }

  function cancelEditingTrueNorth() {
    setEditingTrueNorthId(undefined);
    setTrueNorthEditDraft(defaultTrueNorthDraft);
    setTrueNorthEditError(undefined);
  }

  function handleUpdateTrueNorth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingTrueNorthId) {
      return;
    }

    const title = trueNorthEditDraft.title.trim();

    if (!title) {
      setTrueNorthEditError('Bitte gib einen Titel ein.');
      return;
    }

    updateTrueNorth(editingTrueNorthId, {
      title,
      description: getOptionalFormValue(trueNorthEditDraft.description),
    });
    cancelEditingTrueNorth();
  }

  function handleDeleteTrueNorth(id: string) {
    deleteTrueNorth(id);

    if (editingTrueNorthId === id) {
      cancelEditingTrueNorth();
    }
  }


  function toggleLifeAreaForm() {
    setIsLifeAreaFormOpen((current) => {
      const nextIsOpen = !current;

      if (nextIsOpen) {
        setIsProjectFormOpen(false);
      }

      return nextIsOpen;
    });
  }

  function toggleProjectForm() {
    setIsProjectFormOpen((current) => {
      const nextIsOpen = !current;

      if (nextIsOpen) {
        setIsLifeAreaFormOpen(false);
      }

      return nextIsOpen;
    });
  }

  function updateLifeAreaDraft(patch: Partial<LifeAreaDraft>) {
    setLifeAreaDraft((current) => ({ ...current, ...patch }));
    setLifeAreaError(undefined);
  }

  function resetLifeAreaDraft() {
    setLifeAreaDraft(defaultLifeAreaDraft);
    setLifeAreaError(undefined);
  }

  function handleCreateLifeArea(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = lifeAreaDraft.name.trim();

    if (!name) {
      setLifeAreaError('Bitte gib einen Namen ein.');
      return;
    }

    const timestamp = new Date().toISOString();

    addLifeArea({
      id: createEntityId('la'),
      name,
      description: getOptionalFormValue(lifeAreaDraft.description),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    resetLifeAreaDraft();
    setIsLifeAreaFormOpen(false);
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
      lifeAreaId: getOptionalFormValue(projectDraft.lifeAreaId),
      focusId: getOptionalFormValue(projectDraft.focusId) ?? null,
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

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-[#F5F1EA] sm:text-6xl lg:text-[4rem]">HQ</h1>
            <p className="max-w-2xl text-base leading-7 text-[#B8B1A7]">
              Dein Überblick für Richtung, Fokus, Aufmerksamkeit und Momentum.
            </p>
          </div>
          <div className="lifehq-card-soft flex w-fit items-center gap-3 border-[#D6AD64]/20 bg-black/20 px-4 py-3 text-sm text-[#B8B1A7]" aria-label={`Heute ist ${todayPillDate}`}>
            <span className="text-[#D6AD64]" aria-hidden="true">◷</span>
            <span>{todayPillDate}</span>
          </div>
        </div>
        <QuickStats stats={quickStats} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.44fr)] xl:items-start">
        <div className="space-y-6">
          <HqSection
          title="True North"
          description="Langfristige Richtung deines Lebens."
          eyebrow="01 Orientierung"
          action={<button type="button" onClick={toggleTrueNorthForm} className="lifehq-button-secondary w-fit">True North hinzufügen</button>}
        >
          {isTrueNorthFormOpen && (
            <form onSubmit={handleCreateTrueNorth} className="lifehq-crud-panel">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-[#B8B1A7]">
                  <span className="lifehq-label">Titel</span>
                  <input value={trueNorthDraft.title} onChange={(event) => updateTrueNorthDraft({ title: event.target.value })} className="lifehq-crud-control" placeholder="z. B. Unternehmerische Freiheit" />
                </label>
                <label className="space-y-2 text-sm text-[#B8B1A7]">
                  <span className="lifehq-label">Beschreibung</span>
                  <input value={trueNorthDraft.description} onChange={(event) => updateTrueNorthDraft({ description: event.target.value })} className="lifehq-crud-control" placeholder="Optionale strategische Einordnung" />
                </label>
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {trueNorthError ? <p className="text-sm text-[#D6AD64]">{trueNorthError}</p> : <p className="text-sm text-[#7E776E]">True North beschreibt eine langfristige Richtung, kein Projekt und keine Aufgabe.</p>}
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => { resetTrueNorthDraft(); setIsTrueNorthFormOpen(false); }} className="lifehq-button-secondary">Abbrechen</button>
                  <button type="submit" className="lifehq-button-primary">Speichern</button>
                </div>
              </div>
            </form>
          )}
          <TrueNorthList
            trueNorths={trueNorths}
            editingTrueNorthId={editingTrueNorthId}
            editDraft={trueNorthEditDraft}
            editError={trueNorthEditError}
            onEditStart={startEditingTrueNorth}
            onEditCancel={cancelEditingTrueNorth}
            onEditDraftChange={updateTrueNorthEditDraft}
            onEditSubmit={handleUpdateTrueNorth}
            onDelete={handleDeleteTrueNorth}
          />
        </HqSection>

        <HqSection
          title="Aktueller Fokus"
          description="Verwalte bis zu fünf aktuell priorisierte Lebensthemen."
          eyebrow="02 Fokus"
          prominence="focus"
          action={<button type="button" onClick={toggleFocusForm} className="lifehq-button-primary w-fit">Fokus hinzufügen</button>}
        >
          {isFocusFormOpen && (
            <form onSubmit={handleCreateFocus} className="lifehq-crud-panel">
              <FocusFields draft={focusDraft} trueNorths={trueNorths} onChange={updateFocusDraft} />
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {focusError ? <p className="text-sm text-[#D6AD64]">{focusError}</p> : <p className="text-sm text-[#7E776E]">Empfehlung: drei aktive Fokusse sind ideal, fünf ist die harte Grenze.</p>}
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => { resetFocusDraft(); setIsFocusFormOpen(false); }} className="lifehq-button-secondary">Abbrechen</button>
                  <button type="submit" className="lifehq-button-primary">Speichern</button>
                </div>
              </div>
            </form>
          )}
          <FocusList
            focuses={focuses}
            trueNorths={trueNorths}
            projects={allStatusProjects}
            tasks={tasks}
            editingFocusId={editingFocusId}
            editDraft={focusEditDraft}
            editError={focusEditError}
            onEditStart={startEditingFocus}
            onEditCancel={cancelEditingFocus}
            onEditDraftChange={updateFocusEditDraft}
            onEditSubmit={handleUpdateFocus}
            onArchive={handleArchiveFocus}
            onRestore={handleRestoreFocus}
            onProjectSelect={openProjectDetail}
            restoreError={focusRestoreError}
          />
        </HqSection>

        <HqSection title="Aufmerksamkeit" description="Was darfst du aktuell nicht übersehen?" eyebrow="03 Aufmerksamkeit">
          <AttentionList items={attentionItems} onProjectSelect={openProjectDetail} />
        </HqSection>

        </div>

        <div className="space-y-6 xl:sticky xl:top-6">
          <HqSection title="Momentum" description="Komme ich aktuell voran?" eyebrow="04 Momentum">
            <MomentumCards cards={momentumCards} />
          </HqSection>

          <HqSection title="Vertiefung" description="Zugang zu Projekten, Aufgaben, Kalender und Historie." eyebrow="05 Vertiefung" prominence="primary">
            <div className="space-y-8">
            <HqSection title="Schnellzugriffe" description="Direkter Einstieg in bestehende operative Bereiche.">
              <DeepDiveQuickLinks projects={allStatusProjects} onProjectSelect={openProjectDetail} onTasksOpen={openTasks} />
            </HqSection>

            <HqSection title="Aktive Projekte" description="Reduzierte Vorschau für den nächsten operativen Einstieg.">
              <ActiveProjectPreview projects={activeProjects} tasks={tasks} onProjectSelect={openProjectDetail} />
            </HqSection>

            <HqSection
              title="Lebensbereiche"
              action={<button type="button" onClick={toggleLifeAreaForm} className="lifehq-button-secondary w-fit">Lebensbereich hinzufügen</button>}
            >
              {isLifeAreaFormOpen && (
                <form onSubmit={handleCreateLifeArea} className="lifehq-crud-panel mb-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-sm text-[#B8B1A7]">
                      <span className="lifehq-label">Name</span>
                      <input value={lifeAreaDraft.name} onChange={(event) => updateLifeAreaDraft({ name: event.target.value })} className="lifehq-crud-control" placeholder="Name des Lebensbereichs" />
                    </label>
                    <label className="space-y-2 text-sm text-[#B8B1A7]">
                      <span className="lifehq-label">Beschreibung</span>
                      <input value={lifeAreaDraft.description} onChange={(event) => updateLifeAreaDraft({ description: event.target.value })} className="lifehq-crud-control" placeholder="Optionale Beschreibung" />
                    </label>
                  </div>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {lifeAreaError ? <p className="text-sm text-[#D6AD64]">{lifeAreaError}</p> : <p className="text-sm text-[#7E776E]">Neue Lebensbereiche starten ohne Projekte.</p>}
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => { resetLifeAreaDraft(); setIsLifeAreaFormOpen(false); }} className="lifehq-button-secondary">Abbrechen</button>
                      <button type="submit" className="lifehq-button-primary">Speichern</button>
                    </div>
                  </div>
                </form>
              )}
              <LifeAreaList lifeAreas={lifeAreas} projects={allStatusProjects} tasks={tasks} criticalProjects={criticalProjects} onLifeAreaSelect={openLifeAreaDetail} />
            </HqSection>

            <OrphanProjectList
              projects={orphanProjects}
              tasks={tasks}
              onProjectSelect={openProjectDetail}
              action={<button type="button" onClick={toggleProjectForm} className="lifehq-button-secondary w-fit">Projekt hinzufügen</button>}
            >
              {isProjectFormOpen && (
                <form onSubmit={handleCreateProject} className="lifehq-crud-panel">
                  <div className="grid gap-4 lg:grid-cols-3">
                    <label className="space-y-2 text-sm text-[#B8B1A7] lg:col-span-2"><span className="lifehq-label">Projektname</span><input value={projectDraft.name} onChange={(event) => updateProjectDraft({ name: event.target.value })} className="lifehq-crud-control" placeholder="Name des Projekts" /></label>
                    <label className="space-y-2 text-sm text-[#B8B1A7]"><span className="lifehq-label">Lebensbereich</span><select value={projectDraft.lifeAreaId} onChange={(event) => updateProjectDraft({ lifeAreaId: event.target.value })} className="lifehq-crud-control"><option value="">Ohne Lebensbereich</option>{lifeAreas.map((lifeArea) => <option key={lifeArea.id} value={lifeArea.id}>{getLifeAreaDisplayName(lifeArea.name)}</option>)}</select></label>
                    <label className="space-y-2 text-sm text-[#B8B1A7]"><span className="lifehq-label">Fokus-Zuordnung</span><select value={projectDraft.focusId} onChange={(event) => updateProjectDraft({ focusId: event.target.value })} className="lifehq-crud-control"><option value="">Kein Fokus</option>{selectableFocuses.map((focus) => <option key={focus.id} value={focus.id}>{focus.title}</option>)}</select></label>
                    <label className="space-y-2 text-sm text-[#B8B1A7] lg:col-span-3"><span className="lifehq-label">Beschreibung</span><textarea value={projectDraft.description} onChange={(event) => updateProjectDraft({ description: event.target.value })} className="lifehq-crud-control" rows={3} placeholder="Optionale Beschreibung oder Vision" /></label>
                    <label className="space-y-2 text-sm text-[#B8B1A7]"><span className="lifehq-label">Status</span><select value={projectDraft.status} onChange={(event) => updateProjectDraft({ status: event.target.value as ProjectStatus })} className="lifehq-crud-control">{Object.entries(projectStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                    <label className="space-y-2 text-sm text-[#B8B1A7]"><span className="lifehq-label">Priorität</span><select value={projectDraft.priority} onChange={(event) => updateProjectDraft({ priority: event.target.value as Priority })} className="lifehq-crud-control">{Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                    <label className="space-y-2 text-sm text-[#B8B1A7]"><span className="lifehq-label">Ampelstatus</span><select value={projectDraft.trafficLightStatus} onChange={(event) => updateProjectDraft({ trafficLightStatus: event.target.value as TrafficLightStatus })} className="lifehq-crud-control">{Object.entries(trafficLightLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                    <label className="space-y-2 text-sm text-[#B8B1A7]"><span className="lifehq-label">Zieltermin</span><input type="date" value={projectDraft.targetDate} onChange={(event) => updateProjectDraft({ targetDate: event.target.value })} className="lifehq-crud-control" /></label>
                  </div>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {projectError ? <p className="text-sm text-[#D6AD64]">{projectError}</p> : <p className="text-sm text-[#7E776E]">Projekte können bewusst ohne Lebensbereich starten.</p>}
                    <div className="flex flex-wrap gap-2"><button type="button" onClick={() => { resetProjectDraft(); setIsProjectFormOpen(false); }} className="lifehq-button-secondary">Abbrechen</button><button type="submit" className="lifehq-button-primary">Speichern</button></div>
                  </div>
                </form>
              )}
            </OrphanProjectList>
            </div>
          </HqSection>

          <MotivationCard />
        </div>
      </div>
    </div>
  );
}
