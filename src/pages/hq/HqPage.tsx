import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LifeArea } from '../../models/lifeArea';
import type { Project } from '../../models/project';
import type { Task } from '../../models/task';
import {
  selectActiveProjects,
  selectCompletedProjects,
  selectCriticalProjects,
  selectLifeAreas,
  selectPausedProjects,
  selectTasks,
  selectPlannedProjects,
  useLifeHQStore,
} from '../../store';

interface HqSectionProps {
  title: string;
  description?: string;
  eyebrow?: string;
  children: ReactNode;
  prominence?: 'primary' | 'secondary';
}

function HqSection({ title, description, eyebrow, children, prominence = 'secondary' }: HqSectionProps) {
  return (
    <section className={prominence === 'primary' ? 'space-y-6' : 'lifehq-secondary-project-panel space-y-4 p-4 sm:p-5'}>
      <div className="space-y-2">
        {eyebrow && <p className="text-xs text-[#D6AD64]/70">{eyebrow}</p>}
        <div className="lifehq-section-title">
          <span aria-hidden="true" />
          <h3 className={prominence === 'primary' ? 'font-serif text-2xl font-semibold tracking-tight text-[#F5F1EA]' : 'text-lg font-semibold tracking-tight text-[#F5F1EA]'}>{title}</h3>
        </div>
        {description && <p className="max-w-2xl text-sm leading-6 text-[#7E776E]">{description}</p>}
      </div>
      {children}
    </section>
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
}

function LifeAreaList({ lifeAreas, projects, tasks, criticalProjects }: LifeAreaListProps) {
  if (lifeAreas.length === 0) {
    return <EmptyState>Baue Schritt für Schritt dein persönliches HQ auf.</EmptyState>;
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {lifeAreas.map((lifeArea) => {
        const areaProjects = projects.filter((project) => project.lifeAreaId === lifeArea.id);
        const areaProjectIds = new Set(areaProjects.map((project) => project.id));
        const areaOpenTasks = tasks.filter((task) => task.status !== 'done' && (task.lifeAreaId === lifeArea.id || (task.projectId ? areaProjectIds.has(task.projectId) : false)));
        const areaAttentionProjects = criticalProjects.filter((project) => project.lifeAreaId === lifeArea.id);
        const needsAttention = areaAttentionProjects.length > 0;

        return (
          <article key={lifeArea.id} className="lifehq-domain-card group flex min-h-[13rem] flex-col justify-between p-6 sm:p-7">
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
              </div>
              {needsAttention && (
                <p className="mt-3 flex items-center gap-2 text-xs text-[#D6AD64]/85">
                  <span className="h-2 w-2 rounded-full bg-[#D6AD64] shadow-[0_0_18px_rgba(214,173,100,0.35)]" aria-hidden="true" />
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
        <h3 className="font-serif text-xl font-semibold tracking-tight text-[#F5F1EA]">Projekte ohne Lebensbereich</h3>
      </div>
      <div className="lifehq-unassigned-project-grid">
        {projects.map((project) => {
          const projectOpenTaskCount = tasks.filter((task) => task.projectId === project.id && task.status !== 'done').length;

          return (
            <button key={project.id} type="button" onClick={() => onProjectSelect(project.id)} className="lifehq-unassigned-project-card group flex items-center gap-4 p-6 text-left">
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
    </section>
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
  const tasks = useLifeHQStore(selectTasks);
  const allStatusProjects = [...activeProjects, ...plannedProjects, ...pausedProjects, ...completedProjects];
  const existingLifeAreaIds = new Set(lifeAreas.map((lifeArea) => lifeArea.id));
  const orphanProjects = allStatusProjects.filter((project) => {
    const lifeAreaId = project.lifeAreaId?.trim();

    return !lifeAreaId || !existingLifeAreaIds.has(lifeAreaId);
  });

  const openProjectDetail = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  return (
    <div className="space-y-12">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-center">
        <div className="max-w-3xl space-y-4">
          <h1 className="font-serif text-5xl font-semibold tracking-tight text-[#F5F1EA] sm:text-6xl lg:text-[4rem]">HQ</h1>
          <p className="max-w-2xl text-base leading-7 text-[#B8B1A7]">
            Deine strategische Übersicht über Lebensbereiche und Projekte.
          </p>
        </div>

        <div className="lifehq-attention-card w-full p-6 lg:min-h-32 lg:max-w-[17rem]">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#D6AD64]/40 text-lg text-[#D6AD64]" aria-hidden="true">!</div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#F5F1EA]">Bitte prüfen</p>
              <p className="mt-2 text-3xl font-semibold text-[#D6AD64]">{criticalProjects.length}</p>
              <p className="mt-2 text-sm leading-6 text-[#B8B1A7]">
                Projekte benötigen deine Aufmerksamkeit.
              </p>
            </div>
          </div>
        </div>
      </section>

      <HqSection title="Lebensbereiche" prominence="primary">
        <LifeAreaList lifeAreas={lifeAreas} projects={allStatusProjects} tasks={tasks} criticalProjects={criticalProjects} />
      </HqSection>

      <OrphanProjectList projects={orphanProjects} tasks={tasks} onProjectSelect={openProjectDetail} />
    </div>
  );
}
