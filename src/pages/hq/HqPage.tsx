import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjectCard } from '../../components/hq/ProjectCard';
import type { LifeArea } from '../../models/lifeArea';
import type { Project } from '../../models/project';
import type { Task } from '../../models/task';
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
    <div className="lifehq-card-soft flex min-h-24 flex-col justify-between border-amber-200/10 bg-black/20 p-4">
      <div className="space-y-1.5">
        <p className="text-xs text-slate-500">{label}</p>
        {description && <p className="text-xs leading-5 text-slate-600">{description}</p>}
      </div>
      <p className={tone === 'attention' ? 'mt-3 text-2xl font-semibold text-amber-200' : 'mt-3 text-2xl font-semibold text-slate-200'}>{value}</p>
    </div>
  );
}

interface HqSectionProps {
  title: string;
  description?: string;
  eyebrow?: string;
  children: ReactNode;
  prominence?: 'primary' | 'secondary';
}

function HqSection({ title, description, eyebrow, children, prominence = 'secondary' }: HqSectionProps) {
  return (
    <section className={prominence === 'primary' ? 'space-y-5' : 'lifehq-premium-panel space-y-4 p-4 sm:p-5'}>
      <div className="space-y-2">
        {eyebrow && <p className="text-xs text-amber-200/70">{eyebrow}</p>}
        <div className="lifehq-section-title">
          <span aria-hidden="true" />
          <h3 className={prominence === 'primary' ? 'text-xl font-semibold tracking-tight text-slate-100 sm:text-2xl' : 'text-lg font-semibold tracking-tight text-slate-100'}>{title}</h3>
        </div>
        {description && <p className="max-w-3xl text-sm leading-6 text-slate-500">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="lifehq-empty-state border-amber-200/15 bg-black/20">
      <p className="font-medium text-slate-300">Bereit für Einordnung</p>
      <p className="mt-1 text-slate-500">{children}</p>
    </div>
  );
}

function SectionNote({ children }: { children: ReactNode }) {
  return <p className="lifehq-note border-amber-200/10 bg-black/20">{children}</p>;
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
}

function LifeAreaList({ lifeAreas, projects, tasks, criticalProjects }: LifeAreaListProps) {
  if (lifeAreas.length === 0) {
    return <EmptyState>Baue Schritt für Schritt dein persönliches HQ auf.</EmptyState>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {lifeAreas.map((lifeArea) => {
        const areaProjects = projects.filter((project) => project.lifeAreaId === lifeArea.id);
        const areaProjectIds = new Set(areaProjects.map((project) => project.id));
        const areaOpenTasks = tasks.filter((task) => task.status !== 'done' && (task.lifeAreaId === lifeArea.id || (task.projectId ? areaProjectIds.has(task.projectId) : false)));
        const areaAttentionProjects = criticalProjects.filter((project) => project.lifeAreaId === lifeArea.id);
        const needsAttention = areaAttentionProjects.length > 0;

        return (
          <article key={lifeArea.id} className="lifehq-premium-card group flex min-h-56 flex-col justify-between p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="lifehq-gold-icon" aria-hidden="true">
                {getLifeAreaSymbol(lifeArea.name)}
              </div>
              <span className="text-2xl leading-none text-amber-200/70 transition-transform group-hover:translate-x-1" aria-hidden="true">›</span>
            </div>

            <div className="mt-6 space-y-3">
              <h4 className="text-2xl font-semibold tracking-tight text-slate-100">{lifeArea.name}</h4>
              <p className="min-h-12 text-sm leading-6 text-slate-500">
                {lifeArea.description ?? 'Dieser Lebensbereich ist bereit für deine nächsten strategischen Vorhaben.'}
              </p>
            </div>

            <div className="mt-6 border-t border-white/10 pt-4">
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs leading-5 text-slate-400">
                <span>{getProjectLabel(areaProjects.length)}</span>
                <span>{getOpenTaskLabel(areaOpenTasks.length)}</span>
              </div>
              {needsAttention && (
                <p className="mt-3 flex items-center gap-2 text-xs text-amber-200/85">
                  <span className="h-2 w-2 rounded-full bg-amber-300/80 shadow-[0_0_18px_rgba(251,191,36,0.35)]" aria-hidden="true" />
                  Bitte prüfen
                </p>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

interface OrphanProjectListProps {
  projects: Project[];
  tasks: ReturnType<typeof selectTasks>;
  onProjectSelect: (projectId: string) => void;
}

function OrphanProjectList({ projects, tasks, onProjectSelect }: OrphanProjectListProps) {
  if (projects.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="lifehq-section-title">
        <span aria-hidden="true" />
        <h3 className="text-lg font-semibold tracking-tight text-slate-100">Projekte ohne Lebensbereich</h3>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {projects.map((project) => {
          const projectOpenTaskCount = tasks.filter((task) => task.projectId === project.id && task.status !== 'done').length;

          return (
            <button key={project.id} type="button" onClick={() => onProjectSelect(project.id)} className="lifehq-premium-card group flex items-center gap-4 p-4 text-left sm:p-5">
              <div className="lifehq-gold-icon shrink-0" aria-hidden="true">◎</div>
              <div className="min-w-0 flex-1">
                <h4 className="text-base font-semibold text-slate-100">{project.name}</h4>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">{project.description ?? 'Übergeordnete Planung und Ausrichtung.'}</p>
              </div>
              <div className="hidden text-right text-xs leading-5 text-slate-500 sm:block">
                <p>{getOpenTaskLabel(projectOpenTaskCount)}</p>
                {(project.priority === 'critical' || project.trafficLightStatus === 'red') && <p className="text-amber-200/80">Bitte prüfen</p>}
              </div>
              <span className="text-2xl text-amber-200/70 transition-transform group-hover:translate-x-1" aria-hidden="true">›</span>
            </button>
          );
        })}
      </div>
    </section>
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
  const allStatusProjects = [...activeProjects, ...plannedProjects, ...pausedProjects, ...completedProjects];
  const orphanProjects = allStatusProjects.filter((project) => !project.lifeAreaId);

  const openProjectDetail = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  return (
    <div className="space-y-10">
      <section className="lifehq-hero-panel p-6 sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-center">
          <div className="max-w-3xl space-y-4">
            <h2 className="text-5xl font-semibold tracking-tight text-slate-100 sm:text-6xl lg:text-7xl">HQ</h2>
            <p className="max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
              Deine strategische Übersicht über Lebensbereiche und Projekte.
            </p>
          </div>

          <div className="lifehq-attention-card p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-300/40 text-lg text-amber-200" aria-hidden="true">!</div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-100">Bitte prüfen</p>
                <p className="mt-2 text-3xl font-semibold text-amber-200">{criticalProjects.length}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Projekte benötigen deine Aufmerksamkeit.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="HQ summary">
        <SummaryMetric label="Lebensbereiche" value={lifeAreas.length} description="Strategische Domänen" />
        <SummaryMetric label="Aktive Projekte" value={activeProjects.length} description="Aktuell in Bewegung" />
        <SummaryMetric label="Offene Aufgaben" value={openTasks.length} description="Operativer Kontext" />
        <SummaryMetric label="Bitte prüfen" value={criticalProjects.length} tone="attention" description="Ruhige Aufmerksamkeit" />
      </section>

      <HqSection title="Lebensbereiche" prominence="primary" description="Die wichtigsten Operating Domains deines LifeHQ. Jede Karte bündelt Projekte, offene Aufgaben und ruhige Aufmerksamkeitssignale.">
        <LifeAreaList lifeAreas={lifeAreas} projects={allStatusProjects} tasks={tasks} criticalProjects={criticalProjects} />
      </HqSection>

      <OrphanProjectList projects={orphanProjects} tasks={tasks} onProjectSelect={openProjectDetail} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)]">
        <div className="space-y-5">
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
