import { Link, useParams } from 'react-router-dom';
import type { Priority, ProjectStatus, TrafficLightStatus } from '../../models/common';
import {
  selectLifeAreas,
  selectProjectById,
  useLifeHQStore,
} from '../../store';

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
  green: 'bg-emerald-300/80',
  yellow: 'bg-amber-300/80',
  red: 'bg-rose-300/80',
};

interface DetailFieldProps {
  label: string;
  value: string;
}

function DetailField({ label, value }: DetailFieldProps) {
  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-950/25 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-100">{value}</p>
    </div>
  );
}

export function ProjectDetailPage() {
  const { projectId } = useParams();
  const project = useLifeHQStore(selectProjectById(projectId ?? ''));
  const lifeAreas = useLifeHQStore(selectLifeAreas);
  const lifeArea = project?.lifeAreaId ? lifeAreas.find((area) => area.id === project.lifeAreaId) : undefined;

  if (!project) {
    return (
      <div className="space-y-6">
        <Link to="/hq" className="text-sm font-medium text-slate-300 transition-colors hover:text-white">
          ← Zurück zum HQ
        </Link>
        <section className="rounded-3xl border border-slate-700/60 bg-slate-900/30 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Project Detail</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-100">Projekt nicht gefunden</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Dieses Projekt ist im aktuellen HQ-State nicht vorhanden. Kehre zurück ins HQ und wähle ein vorhandenes Projekt aus.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/hq" className="text-sm font-medium text-slate-300 transition-colors hover:text-white">
        ← Zurück zum HQ
      </Link>

      <section className="rounded-3xl border border-slate-700/60 bg-slate-900/35 p-5 shadow-lg shadow-black/5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Project Detail</p>
            <h2 className="text-2xl font-semibold text-slate-100 sm:text-3xl">{project.name}</h2>
            <p className="text-sm leading-6 text-slate-300">
              {project.description ?? 'Für dieses Projekt ist noch keine Beschreibung oder Vision hinterlegt.'}
            </p>
          </div>

          {project.status === 'paused' && (
            <span className="w-fit rounded-full border border-slate-600/60 bg-slate-950/40 px-3 py-1 text-xs font-medium text-slate-300">
              Bewusst pausiert
            </span>
          )}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <DetailField label="Lebensbereich" value={lifeArea?.name ?? project.lifeAreaId ?? 'Kein Lebensbereich'} />
          <DetailField label="Status" value={projectStatusLabels[project.status]} />
          <DetailField label="Priorität" value={priorityLabels[project.priority]} />
          <div className="rounded-2xl border border-slate-700/50 bg-slate-950/25 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">Ampelstatus</p>
            <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-100">
              <span className={`h-2.5 w-2.5 rounded-full ${trafficLightStyles[project.trafficLightStatus]}`} />
              <span>{trafficLightLabels[project.trafficLightStatus]}</span>
            </div>
          </div>
          <DetailField label="Zieltermin" value={project.targetDate ?? 'Kein Zieltermin'} />
          {project.status === 'paused' && <DetailField label="Pausierungsgrund" value={project.pauseReason ?? 'Kein Grund hinterlegt'} />}
        </div>
      </section>
    </div>
  );
}
