import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
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
  description?: string;
}

function SummaryMetric({ label, value, tone = 'default', description }: SummaryMetricProps) {
  return (
    <div className="lifehq-card flex min-h-32 flex-col justify-between p-4 sm:p-5">
      <div className="space-y-2">
        <p className="lifehq-label">{label}</p>
        {description && <p className="text-xs leading-5 text-slate-500">{description}</p>}
      </div>
      <p className={tone === 'attention' ? 'mt-4 text-3xl font-semibold text-rose-100' : 'mt-4 text-3xl font-semibold text-slate-100'}>{value}</p>
    </div>
  );
}

interface HqSectionProps {
  title: string;
  description: string;
  eyebrow?: string;
  children: ReactNode;
}

function HqSection({ title, description, eyebrow, children }: HqSectionProps) {
  return (
    <section className="lifehq-panel space-y-4 p-4 sm:p-5">
      <div className="space-y-2">
        {eyebrow && <p className="lifehq-label">{eyebrow}</p>}
        <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
        <p className="text-sm leading-6 text-slate-400">{description}</p>
      </div>
      {children}
    </section>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="lifehq-empty-state">
      <p className="font-medium text-slate-400">Bereit für Einordnung</p>
      <p className="mt-1">{children}</p>
    </div>
  );
}

function SectionNote({ children }: { children: ReactNode }) {
  return <p className="lifehq-note">{children}</p>;
}

function LifeAreaList({ lifeAreas }: { lifeAreas: LifeArea[] }) {
  if (lifeAreas.length === 0) {
    return <EmptyState>Baue Schritt für Schritt dein persönliches HQ auf.</EmptyState>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {lifeAreas.map((lifeArea) => (
        <div key={lifeArea.id} className="lifehq-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <p className="lifehq-label">Life Area</p>
              <h4 className="text-base font-semibold text-slate-100">{lifeArea.name}</h4>
              {lifeArea.description && <p className="text-sm leading-6 text-slate-400">{lifeArea.description}</p>}
            </div>
            {lifeArea.status && <span className="lifehq-badge shrink-0">Status: {lifeArea.status}</span>}
          </div>
          {lifeArea.priority && <p className="lifehq-label mt-4">Priority: {lifeArea.priority}</p>}
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
  onProjectSelect: (projectId: string) => void;
}

function ProjectCardList({ projects, lifeAreas, tasks, milestones, emptyText, onProjectSelect }: ProjectCardListProps) {
  if (projects.length === 0) {
    return <EmptyState>{emptyText}</EmptyState>;
  }

  return (
    <div className="grid gap-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          lifeArea={lifeAreas.find((lifeArea) => lifeArea.id === project.lifeAreaId)}
          tasks={tasks}
          milestones={milestones}
          onClick={onProjectSelect}
        />
      ))}
    </div>
  );
}

export function HqPage() {
  const navigate = useNavigate();
  const lifeAreas = useLifeHQStore(selectLifeAreas);
  const activeProjects = useLifeHQStore(selectActiveProjects);
  const plannedProjects = useLifeHQStore(selectPlannedProjects);
  const pausedProjects = useLifeHQStore(selectPausedProjects);
  const completedProjects = useLifeHQStore(selectCompletedProjects);
  const criticalProjects = useLifeHQStore(selectCriticalProjects);
  const redTrafficLightProjects = useLifeHQStore(selectRedTrafficLightProjects);
  const criticalPriorityProjects = criticalProjects.filter((project) => project.priority === 'critical');
  const pausedCriticalProjects = criticalProjects.filter((project) => project.status === 'paused');
  const pausedProjectsWithReviewDate = pausedProjects.filter((project) => project.reviewDate);
  const openTasks = useLifeHQStore(selectOpenTasks);
  const tasks = useLifeHQStore(selectTasks);
  const milestones = useLifeHQStore(selectMilestones);

  const openProjectDetail = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  return (
    <div className="space-y-6">
      <section className="lifehq-panel-strong overflow-hidden p-5 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
          <div className="max-w-3xl space-y-3">
            <p className="lifehq-label">Strategic Overview</p>
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-100 sm:text-4xl">HQ</h2>
              <p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
                Your LifeHQ command surface for reading life areas, strategic projects, focus decisions and attention signals before moving into execution.
              </p>
            </div>
          </div>
          <div className="lifehq-card-soft p-4 text-sm leading-6 text-slate-400">
            <p className="font-medium text-slate-200">Strategic map, not a task list.</p>
            <p className="mt-1">Review where focus is active, planned, paused or asking for calm attention.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="HQ summary">
        <SummaryMetric label="Life Areas" value={lifeAreas.length} description="Top-level domains" />
        <SummaryMetric label="Active Projects" value={activeProjects.length} description="Moving forward now" />
        <SummaryMetric label="Open Tasks" value={openTasks.length} description="Execution context" />
        <SummaryMetric label="Critical Signals" value={criticalProjects.length} tone="attention" description="Need calm review" />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
        <div className="space-y-5">
          <HqSection title="Life Areas" eyebrow="Operating Domains" description="A high-level map of the life domains currently represented in the system.">
            <LifeAreaList lifeAreas={lifeAreas} />
          </HqSection>

          <HqSection title="Active Projects" eyebrow="Current Focus" description="Strategic initiatives that are currently moving forward.">
            <ProjectCardList
              projects={activeProjects}
              lifeAreas={lifeAreas}
              tasks={tasks}
              milestones={milestones}
              emptyText="Noch keine aktiven Projekte. Dieser Bereich ist bereit für deine nächsten Vorhaben."
              onProjectSelect={openProjectDetail}
            />
          </HqSection>

          <HqSection title="Planned Projects" eyebrow="Prepared Direction" description="Potential initiatives prepared for a later execution window.">
            <ProjectCardList
              projects={plannedProjects}
              lifeAreas={lifeAreas}
              tasks={tasks}
              milestones={milestones}
              emptyText="Keine geplanten Projekte. Spätere Initiativen können hier ruhig gesammelt werden."
              onProjectSelect={openProjectDetail}
            />
          </HqSection>
        </div>

        <div className="space-y-5">
          <HqSection title="Critical Projects" eyebrow="Attention Signals" description="Projects that deserve calm attention because priority is critical or the traffic light is red.">
            <SectionNote>
              {criticalProjects.length === 0
                ? 'Keine kritischen Projekte. Aktuell gibt es keine roten strategischen Signale.'
                : `${criticalPriorityProjects.length} mit kritischer Priorität · ${redTrafficLightProjects.length} mit roter Ampel · ${pausedCriticalProjects.length} davon bewusst pausiert. Pausierte kritische Projekte bleiben hier sichtbar markiert.`}
            </SectionNote>
            <ProjectCardList
              projects={criticalProjects}
              lifeAreas={lifeAreas}
              tasks={tasks}
              milestones={milestones}
              emptyText="Keine kritischen Projekte. Aktuell gibt es keine roten strategischen Signale."
              onProjectSelect={openProjectDetail}
            />
          </HqSection>

          <HqSection title="Paused Projects" eyebrow="Focus Decisions" description="Projects intentionally held outside active focus without being lost or completed.">
            <SectionNote>
              {pausedProjects.length === 0
                ? 'Keine pausierten Projekte. Alle sichtbaren Projekte sind aktuell eingeordnet.'
                : `${pausedProjects.length} bewusst pausiert · ${pausedProjectsWithReviewDate.length} mit Wiedervorlage.`}
            </SectionNote>
            <ProjectCardList
              projects={pausedProjects}
              lifeAreas={lifeAreas}
              tasks={tasks}
              milestones={milestones}
              emptyText="Keine pausierten Projekte. Alle sichtbaren Projekte sind aktuell eingeordnet."
              onProjectSelect={openProjectDetail}
            />
          </HqSection>

          <HqSection title="Strategic Signals" eyebrow="Quiet Metrics" description="Quiet context signals for orientation, not a performance dashboard.">
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <SummaryMetric label="Completed" value={completedProjects.length} description="Closed strategic loops" />
              <SummaryMetric label="Red Ampel" value={redTrafficLightProjects.length} tone="attention" description="Projects needing review" />
              <SummaryMetric label="Milestones" value={milestones.length} description="Known project markers" />
            </div>
          </HqSection>
        </div>
      </div>
    </div>
  );
}
