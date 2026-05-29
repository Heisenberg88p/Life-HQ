import type { ReactNode } from 'react';
import { ProjectCard } from '../../components/hq/ProjectCard';
import type { LifeArea } from '../../models/lifeArea';
import type { Project } from '../../models/project';
import {
  selectActiveProjects,
  selectCompletedProjects,
  selectCriticalProjects,
  selectLifeAreas,
  selectMilestones,
  selectOpenTasks,
  selectPausedProjects,
  selectTasks,
  selectPlannedProjects,
  selectRedTrafficLightProjects,
  useLifeHQStore,
} from '../../store';

interface SummaryMetricProps {
  label: string;
  value: number;
  tone?: 'default' | 'attention';
}

function SummaryMetric({ label, value, tone = 'default' }: SummaryMetricProps) {
  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-950/30 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className={tone === 'attention' ? 'mt-3 text-3xl font-semibold text-rose-200' : 'mt-3 text-3xl font-semibold text-slate-100'}>{value}</p>
    </div>
  );
}

interface HqSectionProps {
  title: string;
  description: string;
  children: ReactNode;
}

function HqSection({ title, description, children }: HqSectionProps) {
  return (
    <section className="space-y-3 rounded-3xl border border-slate-700/50 bg-slate-950/20 p-4 sm:p-5">
      <div>
        <h3 className="text-base font-semibold text-slate-100">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
      </div>
      {children}
    </section>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-slate-700/70 px-4 py-3 text-sm text-slate-500">{children}</p>;
}

function LifeAreaList({ lifeAreas }: { lifeAreas: LifeArea[] }) {
  if (lifeAreas.length === 0) {
    return <EmptyState>No life areas available yet.</EmptyState>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {lifeAreas.map((lifeArea) => (
        <div key={lifeArea.id} className="rounded-2xl border border-slate-700/50 bg-slate-900/30 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-slate-100">{lifeArea.name}</p>
              {lifeArea.description && <p className="mt-1 text-sm leading-6 text-slate-400">{lifeArea.description}</p>}
            </div>
            {lifeArea.status && <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300">{lifeArea.status}</span>}
          </div>
          {lifeArea.priority && <p className="mt-3 text-xs uppercase tracking-[0.16em] text-muted">Priority: {lifeArea.priority}</p>}
        </div>
      ))}
    </div>
  );
}

interface ProjectCardListProps {
  projects: Project[];
  lifeAreas: LifeArea[];
  tasks: ReturnType<typeof selectTasks>;
  milestones: ReturnType<typeof selectMilestones>;
  emptyText: string;
}

function ProjectCardList({ projects, lifeAreas, tasks, milestones, emptyText }: ProjectCardListProps) {
  if (projects.length === 0) {
    return <EmptyState>{emptyText}</EmptyState>;
  }

  return (
    <div className="space-y-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          lifeArea={lifeAreas.find((lifeArea) => lifeArea.id === project.lifeAreaId)}
          tasks={tasks}
          milestones={milestones}
        />
      ))}
    </div>
  );
}

export function HqPage() {
  const lifeAreas = useLifeHQStore(selectLifeAreas);
  const activeProjects = useLifeHQStore(selectActiveProjects);
  const plannedProjects = useLifeHQStore(selectPlannedProjects);
  const pausedProjects = useLifeHQStore(selectPausedProjects);
  const completedProjects = useLifeHQStore(selectCompletedProjects);
  const criticalProjects = useLifeHQStore(selectCriticalProjects);
  const redTrafficLightProjects = useLifeHQStore(selectRedTrafficLightProjects);
  const openTasks = useLifeHQStore(selectOpenTasks);
  const tasks = useLifeHQStore(selectTasks);
  const milestones = useLifeHQStore(selectMilestones);

  return (
    <div className="space-y-6">
      <section className="max-w-3xl space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Strategic Overview</p>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold sm:text-3xl">HQ</h2>
          <p className="max-w-2xl text-sm leading-6 text-slate-300">
            Your LifeHQ command surface for reading the current strategic landscape before moving into operational execution.
          </p>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="HQ summary">
        <SummaryMetric label="Life Areas" value={lifeAreas.length} />
        <SummaryMetric label="Active Projects" value={activeProjects.length} />
        <SummaryMetric label="Open Tasks" value={openTasks.length} />
        <SummaryMetric label="Critical Signals" value={criticalProjects.length} tone="attention" />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
        <div className="space-y-4">
          <HqSection title="Life Areas" description="A high-level map of the life domains currently represented in the system.">
            <LifeAreaList lifeAreas={lifeAreas} />
          </HqSection>

          <HqSection title="Active Projects" description="Strategic initiatives that are currently moving forward.">
            <ProjectCardList projects={activeProjects} lifeAreas={lifeAreas} tasks={tasks} milestones={milestones} emptyText="Keine aktiven Projekte vorhanden." />
          </HqSection>

          <HqSection title="Planned Projects" description="Potential initiatives prepared for a later execution window.">
            <ProjectCardList projects={plannedProjects} lifeAreas={lifeAreas} tasks={tasks} milestones={milestones} emptyText="Keine geplanten Projekte vorhanden." />
          </HqSection>
        </div>

        <div className="space-y-4">
          <HqSection title="Critical Projects" description="Projects marked critical or carrying a red traffic-light signal.">
            <ProjectCardList projects={criticalProjects} lifeAreas={lifeAreas} tasks={tasks} milestones={milestones} emptyText="Keine kritischen Projekte vorhanden." />
          </HqSection>

          <HqSection title="Paused Projects" description="Projects intentionally stopped or waiting for a later review.">
            <ProjectCardList projects={pausedProjects} lifeAreas={lifeAreas} tasks={tasks} milestones={milestones} emptyText="Keine pausierten Projekte vorhanden." />
          </HqSection>

          <HqSection title="Strategic Signals" description="Small counters for future HQ context without building detail workflows yet.">
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <SummaryMetric label="Completed" value={completedProjects.length} />
              <SummaryMetric label="Red Signals" value={redTrafficLightProjects.length} tone="attention" />
              <SummaryMetric label="Milestones" value={milestones.length} />
            </div>
          </HqSection>
        </div>
      </div>
    </div>
  );
}
