import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LifeSystem } from '../../models/lifeSystem';
import type { LifeSystemPhase, LifeSystemPhaseStatus } from '../../models/lifeSystemPhase';
import type { Project } from '../../models/project';
import type { Vision } from '../../models/vision';
import { buildPrioritizedFocusCandidates, type FocusPriorityLevel, type FocusCandidateSourceType, type PrioritizedFocusCandidate } from '../../features/focus';
import { priorityLabels, projectStatusLabels, trafficLightLabels } from '../../constants/displayLabels';
import { formatDateDisplay } from '../../utils/dateFormat';
import { selectLifeSystemPhases, selectLifeSystems, selectMilestones, selectProjects, selectTasks, selectVisions, useLifeHQStore } from '../../store';

type VisionDraft = {
  title: string;
  description: string;
};

type LifeSystemDraft = {
  name: string;
  description: string;
};

type LifeSystemPhaseDraft = {
  title: string;
  description: string;
  status: LifeSystemPhaseStatus;
};

type ProjectDraft = {
  name: string;
  description: string;
};

const lifeSystemPhaseStatusOptions: Array<{ value: LifeSystemPhaseStatus; label: string }> = [
  { value: 'planned', label: 'Geplant' },
  { value: 'active', label: 'Aktiv' },
  { value: 'completed', label: 'Abgeschlossen' },
  { value: 'archived', label: 'Archiviert' },
];

const focusPriorityLabels: Record<FocusPriorityLevel, string> = {
  critical: 'Kritisch',
  high: 'Hoch',
  medium: 'Mittel',
  low: 'Niedrig',
};

const focusSourceTypeLabels: Record<FocusCandidateSourceType, string> = {
  project: 'Projekt',
  task: 'Aufgabe',
  milestone: 'Meilenstein',
  lifeSystem: 'Lebenssystem',
};

const focusPriorityStyles: Record<FocusPriorityLevel, string> = {
  critical: 'border-red-300/35 bg-red-500/10 text-red-100',
  high: 'border-orange-300/30 bg-orange-500/10 text-orange-100',
  medium: 'border-[#D6AD64]/35 bg-[#D6AD64]/10 text-[#F5D28B]',
  low: 'border-white/10 bg-white/[0.04] text-[#C9C1B8]',
};

const createEntityId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const createVisionId = () => createEntityId('vision');
const createLifeSystemId = () => createEntityId('life-system');

const createVisionDraft = (vision?: Vision): VisionDraft => ({
  title: vision?.title ?? '',
  description: vision?.description ?? '',
});

const emptyLifeSystemDraft: LifeSystemDraft = { name: '', description: '' };
const emptyLifeSystemPhaseDraft: LifeSystemPhaseDraft = { title: '', description: '', status: 'planned' };
const emptyProjectDraft: ProjectDraft = { name: '', description: '' };

function getOptionalDescription(value: string): string | undefined {
  const trimmedValue = value.trim();

  return trimmedValue ? trimmedValue : undefined;
}

function VisionHeroSection() {
  const visions = useLifeHQStore(selectVisions);
  const addVision = useLifeHQStore((state) => state.addVision);
  const updateVision = useLifeHQStore((state) => state.updateVision);
  const activeVision = visions[0];
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<VisionDraft>(() => createVisionDraft(activeVision));
  const [error, setError] = useState<string>();
  const isCreating = !activeVision;
  const showForm = isEditing || isCreating;

  const startEditing = () => {
    setDraft(createVisionDraft(activeVision));
    setError(undefined);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setDraft(createVisionDraft(activeVision));
    setError(undefined);
    setIsEditing(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = draft.title.trim();

    if (!title) {
      setError('Bitte gib einen Vision-Titel ein.');
      return;
    }

    const timestamp = new Date().toISOString();
    const description = getOptionalDescription(draft.description);

    if (activeVision) {
      updateVision(activeVision.id, { title, description });
    } else {
      addVision({
        id: createVisionId(),
        title,
        description,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }

    setError(undefined);
    setIsEditing(false);
  };

  return (
    <section className="lifehq-premium-card overflow-hidden border-[#D6AD64]/20 bg-[radial-gradient(circle_at_top_left,rgba(214,173,100,0.16),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.055),rgba(0,0,0,0.18))] p-6 sm:p-8 lg:p-10">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl space-y-5">
          <p className="text-xs uppercase tracking-[0.3em] text-[#D6AD64]/70">Deine langfristige Lebensrichtung</p>
          {!showForm && activeVision ? (
            <div className="space-y-5">
              <h1 className="font-serif text-4xl font-semibold tracking-tight text-[#F5F1EA] sm:text-5xl lg:text-6xl">{activeVision.title}</h1>
              {activeVision.description && <p className="max-w-2xl text-lg leading-8 text-[#C9C1B8] sm:text-xl">{activeVision.description}</p>}
            </div>
          ) : (
            <div className="space-y-4">
              <h1 className="font-serif text-4xl font-semibold tracking-tight text-[#F5F1EA] sm:text-5xl lg:text-6xl">
                {activeVision ? 'Vision bearbeiten' : 'Definiere deine Vision'}
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[#C9C1B8]">Beschreibe, warum du dieses Leben aufbauen möchtest.</p>
            </div>
          )}
        </div>

        {!showForm && activeVision && (
          <button type="button" onClick={startEditing} className="w-fit rounded-full border border-[#D6AD64]/25 px-5 py-2.5 text-sm font-medium text-[#F5D28B] transition hover:border-[#D6AD64]/45 hover:bg-[#D6AD64]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D6AD64]/70">
            Vision bearbeiten
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-8 max-w-2xl space-y-5 rounded-3xl border border-white/[0.08] bg-black/15 p-4 sm:p-5">
          <div className="space-y-2">
            <label htmlFor="vision-title" className="text-sm font-medium text-[#F5F1EA]">Titel</label>
            <input
              id="vision-title"
              type="text"
              value={draft.title}
              onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, title: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-base text-[#F5F1EA] outline-none transition placeholder:text-[#7E776E] focus:border-[#D6AD64]/50 focus:ring-2 focus:ring-[#D6AD64]/15"
              placeholder="Wofür baust du dieses Leben auf?"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="vision-description" className="text-sm font-medium text-[#F5F1EA]">Beschreibung</label>
            <textarea
              id="vision-description"
              value={draft.description}
              onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, description: event.target.value }))}
              className="min-h-36 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-base leading-7 text-[#F5F1EA] outline-none transition placeholder:text-[#7E776E] focus:border-[#D6AD64]/50 focus:ring-2 focus:ring-[#D6AD64]/15"
              placeholder="Beschreibe, warum du dieses Leben aufbauen möchtest."
            />
          </div>
          {error && <p className="text-sm text-red-200">{error}</p>}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button type="submit" className="rounded-full bg-[#D6AD64] px-5 py-2.5 text-sm font-semibold text-[#1F1A14] transition hover:bg-[#F0C979] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D6AD64]/70">
              Vision speichern
            </button>
            {activeVision && (
              <button type="button" onClick={cancelEditing} className="rounded-full border border-white/10 px-5 py-2.5 text-sm font-medium text-[#C9C1B8] transition hover:border-white/20 hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40">
                Abbrechen
              </button>
            )}
          </div>
        </form>
      )}
    </section>
  );
}

function getCurrentPhaseLabel(
  lifeSystem: LifeSystem,
  phases: LifeSystemPhase[],
): string {
  if (!lifeSystem.currentPhaseId) {
    return 'Keine aktuelle Phase';
  }

  return (
    phases.find(
      (phase) =>
        phase.id === lifeSystem.currentPhaseId &&
        phase.lifeSystemId === lifeSystem.id,
    )?.title ?? 'Phase nicht gefunden'
  );
}


function getPhaseStatusLabel(status: LifeSystemPhaseStatus): string {
  return lifeSystemPhaseStatusOptions.find((option) => option.value === status)?.label ?? status;
}

function getSortedLifeSystemPhases(phases: LifeSystemPhase[]): LifeSystemPhase[] {
  return [...phases].sort((firstPhase, secondPhase) => firstPhase.order - secondPhase.order || firstPhase.createdAt.localeCompare(secondPhase.createdAt));
}


function ProjectSummaryItem({ project, action }: { project: Project; action: ReactNode }) {
  return (
    <article className="rounded-2xl border border-white/[0.08] bg-black/15 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h4 className="font-medium text-[#F5F1EA]">{project.name}</h4>
          {project.description && <p className="line-clamp-2 text-sm leading-6 text-[#B8B1A7]">{project.description}</p>}
          <div className="flex flex-wrap gap-2 text-xs text-[#C9C1B8]">
            <span className="rounded-full border border-white/10 px-3 py-1">{projectStatusLabels[project.status]}</span>
            <span className="rounded-full border border-white/10 px-3 py-1">{priorityLabels[project.priority]}</span>
            <span className="rounded-full border border-white/10 px-3 py-1">{trafficLightLabels[project.trafficLightStatus]}</span>
            {project.targetDate && <span className="rounded-full border border-white/10 px-3 py-1">{formatDateDisplay(project.targetDate)}</span>}
          </div>
        </div>
        {action}
      </div>
    </article>
  );
}

function LifeSystemCard({ lifeSystem, phases, projectCount, onClick }: { lifeSystem: LifeSystem; phases: LifeSystemPhase[]; projectCount: number; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="lifehq-premium-card w-full border-white/[0.08] bg-[linear-gradient(135deg,rgba(255,255,255,0.045),rgba(0,0,0,0.16))] p-5 text-left transition hover:border-[#D6AD64]/30 hover:bg-[#D6AD64]/[0.045] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D6AD64]/70 sm:p-6">
      <div className="space-y-5">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.24em] text-[#D6AD64]/60">Life System</p>
          <h3 className="font-serif text-2xl font-semibold tracking-tight text-[#F5F1EA]">{lifeSystem.name}</h3>
          {lifeSystem.description && <p className="text-sm leading-6 text-[#B8B1A7]">{lifeSystem.description}</p>}
        </div>

        <div className="grid gap-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="rounded-2xl border border-white/[0.08] bg-black/15 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-[#7E776E]">Phasen</p>
            {phases.length === 0 ? (
              <p className="mt-2 text-[#B8B1A7]">Keine Phasen angelegt</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {phases.map((phase) => {
                  const isCurrentPhase = phase.id === lifeSystem.currentPhaseId;

                  return (
                    <span
                      key={phase.id}
                      className={isCurrentPhase
                        ? 'rounded-full border border-[#D6AD64]/55 bg-[#D6AD64]/10 px-3 py-1 text-xs font-medium text-[#F5D28B]'
                        : 'rounded-full border border-white/10 px-3 py-1 text-xs text-[#C9C1B8]'}
                    >
                      {phase.title}
                      {isCurrentPhase && <span className="ml-1.5 text-[0.65rem] uppercase tracking-[0.12em]">Aktuell</span>}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-black/15 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-[#7E776E]">Projekte</p>
            <p className="mt-2 font-medium text-[#F5F1EA]">{projectCount === 1 ? '1 Projekt' : `${projectCount} Projekte`}</p>
          </div>
        </div>

        {projectCount === 0 && <p className="rounded-2xl border border-[#D6AD64]/15 bg-[#D6AD64]/[0.055] px-4 py-3 text-sm leading-6 text-[#D8C7AA]">Noch keine Projekte zugeordnet.</p>}
      </div>
    </button>
  );
}

function LifeSystemDetailModal({ lifeSystem, currentPhaseLabel, projectCount, onClose }: { lifeSystem: LifeSystem; currentPhaseLabel: string; projectCount: number; onClose: () => void }) {
  const navigate = useNavigate();
  const updateLifeSystem = useLifeHQStore((state) => state.updateLifeSystem);
  const deleteLifeSystem = useLifeHQStore((state) => state.deleteLifeSystem);
  const phases = useLifeHQStore((state) => state.lifeSystemPhases.filter((phase) => phase.lifeSystemId === lifeSystem.id));
  const projects = useLifeHQStore(selectProjects);
  const addProject = useLifeHQStore((state) => state.addProject);
  const assignProjectToLifeSystem = useLifeHQStore((state) => state.assignProjectToLifeSystem);
  const removeProjectFromLifeSystem = useLifeHQStore((state) => state.removeProjectFromLifeSystem);
  const createLifeSystemPhase = useLifeHQStore((state) => state.createLifeSystemPhase);
  const updateLifeSystemPhase = useLifeHQStore((state) => state.updateLifeSystemPhase);
  const deleteLifeSystemPhase = useLifeHQStore((state) => state.deleteLifeSystemPhase);
  const setCurrentLifeSystemPhase = useLifeHQStore((state) => state.setCurrentLifeSystemPhase);
  const sortedPhases = getSortedLifeSystemPhases(phases);
  const assignedProjects = projects.filter((project) => project.lifeSystemId === lifeSystem.id);
  const assignableProjects = projects.filter((project) => !project.lifeSystemId);
  const [draft, setDraft] = useState<LifeSystemDraft>({ name: lifeSystem.name, description: lifeSystem.description ?? '' });
  const [error, setError] = useState<string>();
  const [phaseDraft, setPhaseDraft] = useState<LifeSystemPhaseDraft>(emptyLifeSystemPhaseDraft);
  const [phaseError, setPhaseError] = useState<string>();
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectDraft, setProjectDraft] = useState<ProjectDraft>(emptyProjectDraft);
  const [projectError, setProjectError] = useState<string>();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = draft.name.trim();

    if (!name) {
      setError('Bitte gib einen Namen für das Lebenssystem ein.');
      return;
    }

    updateLifeSystem(lifeSystem.id, {
      name,
      description: getOptionalDescription(draft.description),
    });
    setError(undefined);
    onClose();
  };

  const handleDelete = () => {
    if (!window.confirm(`Lebenssystem "${lifeSystem.name}" wirklich löschen?`)) {
      return;
    }

    deleteLifeSystem(lifeSystem.id);
    onClose();
  };



  const handleAssignProject = () => {
    if (!selectedProjectId) {
      setProjectError('Bitte wähle ein Projekt aus.');
      return;
    }

    assignProjectToLifeSystem(selectedProjectId, lifeSystem.id);
    setSelectedProjectId('');
    setProjectError(undefined);
  };

  const handleCreateProject = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = projectDraft.name.trim();

    if (!name) {
      setProjectError('Bitte gib einen Projektnamen ein.');
      return;
    }

    const timestamp = new Date().toISOString();

    addProject({
      id: createEntityId('project'),
      name,
      description: getOptionalDescription(projectDraft.description),
      lifeSystemId: lifeSystem.id,
      status: 'planned',
      priority: 'medium',
      trafficLightStatus: 'green',
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    setProjectDraft(emptyProjectDraft);
    setProjectError(undefined);
  };

  const handleCreatePhase = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = phaseDraft.title.trim();

    if (!title) {
      setPhaseError('Bitte gib einen Phasentitel ein.');
      return;
    }

    const timestamp = new Date().toISOString();
    const nextOrder = sortedPhases.reduce((maxOrder, phase) => Math.max(maxOrder, phase.order), 0) + 1;

    createLifeSystemPhase({
      id: createEntityId('life-system-phase'),
      lifeSystemId: lifeSystem.id,
      title,
      description: getOptionalDescription(phaseDraft.description),
      status: 'planned',
      order: nextOrder,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    setPhaseDraft(emptyLifeSystemPhaseDraft);
    setPhaseError(undefined);
  };

  const handleUpdatePhase = (phaseId: string, patch: Partial<LifeSystemPhase>) => {
    if (typeof patch.title === 'string' && !patch.title.trim()) {
      setPhaseError('Bitte gib einen Phasentitel ein.');
      return;
    }

    setPhaseError(undefined);
    updateLifeSystemPhase(phaseId, patch);
  };

  const handleDeletePhase = (phase: LifeSystemPhase) => {
    if (!window.confirm(`Phase "${phase.title}" wirklich löschen?`)) {
      return;
    }

    deleteLifeSystemPhase(phase.id);
  };


  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-4 py-6 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="life-system-modal-title">
      <div className="lifehq-premium-card max-h-[calc(100vh-3rem)] w-full max-w-2xl overflow-y-auto border-[#D6AD64]/20 bg-[#17130F] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.45)] sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.28em] text-[#D6AD64]/65">Life System</p>
            <h2 id="life-system-modal-title" className="font-serif text-3xl font-semibold tracking-tight text-[#F5F1EA]">{lifeSystem.name}</h2>
            {lifeSystem.description && <p className="max-w-xl text-sm leading-6 text-[#B8B1A7]">{lifeSystem.description}</p>}
          </div>
          <button type="button" onClick={onClose} className="w-fit rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-[#C9C1B8] transition hover:border-white/20 hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40">
            Schließen
          </button>
        </div>

        <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-2xl border border-white/[0.08] bg-black/15 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[#7E776E]">Aktuelle Phase</p>
            <p className="mt-2 font-medium text-[#F5F1EA]">{currentPhaseLabel}</p>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-black/15 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[#7E776E]">Projekte</p>
            <p className="mt-2 font-medium text-[#F5F1EA]">{projectCount === 1 ? '1 Projekt' : `${projectCount} Projekte`}</p>
          </div>
        </div>



        <section className="mt-7 rounded-3xl border border-white/[0.08] bg-black/15 p-4 sm:p-5">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-[#D6AD64]/60">Projekte</p>
            <h3 className="font-serif text-2xl font-semibold text-[#F5F1EA]">Projekte</h3>
            <p className="text-sm leading-6 text-[#B8B1A7]">{assignedProjects.length === 1 ? '1 Projekt ist diesem Lebenssystem zugeordnet.' : `${assignedProjects.length} Projekte sind diesem Lebenssystem zugeordnet.`}</p>
          </div>

          <div className="mt-5 space-y-3">
            {assignedProjects.length === 0 ? (
              <p className="rounded-2xl border border-white/[0.08] bg-black/15 px-4 py-3 text-sm leading-6 text-[#B8B1A7]">Noch keine Projekte zugeordnet.</p>
            ) : assignedProjects.map((project) => (
              <ProjectSummaryItem
                key={project.id}
                project={project}
                action={(
                  <div className="flex flex-col gap-2 sm:items-end">
                    <button type="button" onClick={() => navigate(`/projects/${project.id}`)} className="w-fit rounded-full border border-[#D6AD64]/25 px-4 py-2 text-sm font-medium text-[#F5D28B] transition hover:border-[#D6AD64]/45 hover:bg-[#D6AD64]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D6AD64]/70">
                      Projekt öffnen
                    </button>
                    <button type="button" onClick={() => removeProjectFromLifeSystem(project.id)} className="w-fit rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-[#C9C1B8] transition hover:border-white/20 hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40">
                      Zuordnung entfernen
                    </button>
                  </div>
                )}
              />
            ))}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/[0.08] bg-black/15 p-4">
              <p className="text-sm font-medium text-[#F5F1EA]">Projekt zuordnen</p>
              <div className="mt-3 flex flex-col gap-3">
                <select
                  value={selectedProjectId}
                  onChange={(event) => setSelectedProjectId(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-[#F5F1EA] outline-none transition focus:border-[#D6AD64]/50 focus:ring-2 focus:ring-[#D6AD64]/15"
                  aria-label="Projekt zuordnen"
                >
                  <option value="">Unzugeordnetes Projekt wählen</option>
                  {assignableProjects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
                <button type="button" onClick={handleAssignProject} disabled={assignableProjects.length === 0} className="rounded-full border border-[#D6AD64]/25 px-4 py-2 text-sm font-medium text-[#F5D28B] transition hover:border-[#D6AD64]/45 hover:bg-[#D6AD64]/10 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D6AD64]/70">
                  Projekt zuordnen
                </button>
              </div>
              {assignableProjects.length === 0 && <p className="mt-3 text-sm leading-6 text-[#7E776E]">Keine unzugeordneten Projekte verfügbar.</p>}
            </div>

            <form onSubmit={handleCreateProject} className="rounded-3xl border border-white/[0.08] bg-black/15 p-4">
              <p className="text-sm font-medium text-[#F5F1EA]">Neues Projekt erstellen</p>
              <div className="mt-3 space-y-3">
                <input
                  type="text"
                  value={projectDraft.name}
                  onChange={(event) =>
                    setProjectDraft((currentDraft: ProjectDraft) => ({ ...currentDraft, name: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-[#F5F1EA] outline-none transition placeholder:text-[#7E776E] focus:border-[#D6AD64]/50 focus:ring-2 focus:ring-[#D6AD64]/15"
                  placeholder="Projektname"
                  aria-label="Projektname"
                />
                <textarea
                  value={projectDraft.description}
                  onChange={(event) =>
                    setProjectDraft((currentDraft: ProjectDraft) => ({
                      ...currentDraft,
                      description: event.target.value,
                    }))
                  }
                  className="min-h-24 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm leading-6 text-[#F5F1EA] outline-none transition placeholder:text-[#7E776E] focus:border-[#D6AD64]/50 focus:ring-2 focus:ring-[#D6AD64]/15"
                  placeholder="Beschreibung optional"
                  aria-label="Projektbeschreibung"
                />
                {projectError && <p className="text-sm text-red-200">{projectError}</p>}
                <button type="submit" className="rounded-full bg-[#D6AD64] px-5 py-2.5 text-sm font-semibold text-[#1F1A14] transition hover:bg-[#F0C979] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D6AD64]/70">
                  Projekt erstellen
                </button>
              </div>
            </form>
          </div>
        </section>


        <section className="mt-7 rounded-3xl border border-white/[0.08] bg-black/15 p-4 sm:p-5">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-[#D6AD64]/60">Entwicklungsphasen</p>
            <h3 className="font-serif text-2xl font-semibold text-[#F5F1EA]">Entwicklungsphasen</h3>
            <p className="text-sm leading-6 text-[#B8B1A7]">{lifeSystem.currentPhaseId ? `Aktuelle Phase: ${currentPhaseLabel}` : 'Keine aktuelle Phase'}</p>
          </div>

          <div className="mt-5 space-y-3">
            {sortedPhases.length === 0 ? (
              <p className="rounded-2xl border border-white/[0.08] bg-black/15 px-4 py-3 text-sm leading-6 text-[#B8B1A7]">Noch keine Entwicklungsphasen angelegt.</p>
            ) : sortedPhases.map((phase) => {
              const isCurrentPhase = phase.id === lifeSystem.currentPhaseId;

              return (
                <article key={phase.id} className={`rounded-3xl border p-4 ${isCurrentPhase ? 'border-[#D6AD64]/35 bg-[#D6AD64]/[0.06]' : 'border-white/[0.08] bg-black/15'}`}>
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-[#7E776E]">Reihenfolge {phase.order}</p>
                      {isCurrentPhase && <p className="mt-1 text-xs font-medium text-[#F5D28B]">Aktuelle Phase</p>}
                    </div>
                    <span className="w-fit rounded-full border border-white/10 px-3 py-1 text-xs text-[#C9C1B8]">{getPhaseStatusLabel(phase.status)}</span>
                  </div>

                  <div className="grid gap-3">
                    <input
                      type="text"
                      value={phase.title}
                      onChange={(event) => handleUpdatePhase(phase.id, { title: event.target.value })}
                      className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-[#F5F1EA] outline-none transition focus:border-[#D6AD64]/50 focus:ring-2 focus:ring-[#D6AD64]/15"
                      aria-label="Phasentitel"
                    />
                    <textarea
                      value={phase.description ?? ''}
                      onChange={(event) => handleUpdatePhase(phase.id, { description: getOptionalDescription(event.target.value) })}
                      className="min-h-24 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm leading-6 text-[#F5F1EA] outline-none transition placeholder:text-[#7E776E] focus:border-[#D6AD64]/50 focus:ring-2 focus:ring-[#D6AD64]/15"
                      placeholder="Beschreibung optional"
                      aria-label="Phasenbeschreibung"
                    />
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <select
                        value={phase.status}
                        onChange={(event) => handleUpdatePhase(phase.id, { status: event.target.value as LifeSystemPhaseStatus })}
                        className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-[#F5F1EA] outline-none transition focus:border-[#D6AD64]/50 focus:ring-2 focus:ring-[#D6AD64]/15"
                        aria-label="Phasenstatus"
                      >
                        {lifeSystemPhaseStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        {!isCurrentPhase && (
                          <button type="button" onClick={() => setCurrentLifeSystemPhase(lifeSystem.id, phase.id)} className="rounded-full border border-[#D6AD64]/25 px-4 py-2 text-sm font-medium text-[#F5D28B] transition hover:border-[#D6AD64]/45 hover:bg-[#D6AD64]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D6AD64]/70">
                            Als aktuelle Phase setzen
                          </button>
                        )}
                        <button type="button" onClick={() => handleDeletePhase(phase)} className="rounded-full border border-red-300/20 px-4 py-2 text-sm font-medium text-red-100 transition hover:border-red-300/35 hover:bg-red-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-200/60">
                          Phase löschen
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <form onSubmit={handleCreatePhase} className="mt-5 space-y-4 rounded-3xl border border-white/[0.08] bg-black/15 p-4">
            <div className="space-y-2">
              <label htmlFor="new-phase-title" className="text-sm font-medium text-[#F5F1EA]">Neue Phase</label>
              <input
                id="new-phase-title"
                type="text"
                value={phaseDraft.title}
                onChange={(event) => setPhaseDraft((currentDraft) => ({ ...currentDraft, title: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-[#F5F1EA] outline-none transition placeholder:text-[#7E776E] focus:border-[#D6AD64]/50 focus:ring-2 focus:ring-[#D6AD64]/15"
                placeholder="Titel der Entwicklungsphase"
              />
            </div>
            <textarea
              value={phaseDraft.description}
              onChange={(event) => setPhaseDraft((currentDraft) => ({ ...currentDraft, description: event.target.value }))}
              className="min-h-24 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm leading-6 text-[#F5F1EA] outline-none transition placeholder:text-[#7E776E] focus:border-[#D6AD64]/50 focus:ring-2 focus:ring-[#D6AD64]/15"
              placeholder="Beschreibung optional"
              aria-label="Beschreibung der neuen Phase"
            />
            {phaseError && <p className="text-sm text-red-200">{phaseError}</p>}
            <button type="submit" className="rounded-full bg-[#D6AD64] px-5 py-2.5 text-sm font-semibold text-[#1F1A14] transition hover:bg-[#F0C979] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D6AD64]/70">
              Phase erstellen
            </button>
          </form>
        </section>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <div className="space-y-2">
            <label htmlFor="life-system-modal-name" className="text-sm font-medium text-[#F5F1EA]">Name</label>
            <input
              id="life-system-modal-name"
              type="text"
              value={draft.name}
              onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, name: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-base text-[#F5F1EA] outline-none transition placeholder:text-[#7E776E] focus:border-[#D6AD64]/50 focus:ring-2 focus:ring-[#D6AD64]/15"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="life-system-modal-description" className="text-sm font-medium text-[#F5F1EA]">Beschreibung</label>
            <textarea
              id="life-system-modal-description"
              value={draft.description}
              onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, description: event.target.value }))}
              className="min-h-28 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-base leading-7 text-[#F5F1EA] outline-none transition placeholder:text-[#7E776E] focus:border-[#D6AD64]/50 focus:ring-2 focus:ring-[#D6AD64]/15"
            />
          </div>
          {error && <p className="text-sm text-red-200">{error}</p>}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button type="submit" className="rounded-full bg-[#D6AD64] px-5 py-2.5 text-sm font-semibold text-[#1F1A14] transition hover:bg-[#F0C979] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D6AD64]/70">
                Speichern
              </button>
              <button type="button" onClick={onClose} className="rounded-full border border-white/10 px-5 py-2.5 text-sm font-medium text-[#C9C1B8] transition hover:border-white/20 hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40">
                Abbrechen
              </button>
            </div>
            <button type="button" onClick={handleDelete} className="rounded-full border border-red-300/20 px-5 py-2.5 text-sm font-medium text-red-100 transition hover:border-red-300/35 hover:bg-red-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-200/60">
              Löschen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LifeSystemsGridSection() {
  const lifeSystems = useLifeHQStore(selectLifeSystems);
  const phases = useLifeHQStore(selectLifeSystemPhases);
  const projects = useLifeHQStore(selectProjects);
  const createLifeSystem = useLifeHQStore((state) => state.createLifeSystem);
  const [showCreateForm, setShowCreateForm] = useState(lifeSystems.length === 0);
  const [draft, setDraft] = useState<LifeSystemDraft>(emptyLifeSystemDraft);
  const [error, setError] = useState<string>();
  const [selectedLifeSystemId, setSelectedLifeSystemId] = useState<string>();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = draft.name.trim();

    if (!name) {
      setError('Bitte gib einen Namen für das Lebenssystem ein.');
      return;
    }

    const timestamp = new Date().toISOString();

    createLifeSystem({
      id: createLifeSystemId(),
      name,
      description: getOptionalDescription(draft.description),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    setDraft(emptyLifeSystemDraft);
    setError(undefined);
    setShowCreateForm(false);
  };

  const selectedLifeSystem = lifeSystems.find((lifeSystem) => lifeSystem.id === selectedLifeSystemId);
  const selectedLifeSystemProjectCount = selectedLifeSystem ? projects.filter((project) => project.lifeSystemId === selectedLifeSystem.id).length : 0;
  const selectedLifeSystemPhaseLabel = selectedLifeSystem ? getCurrentPhaseLabel(selectedLifeSystem, phases) : '';

  return (
    <section className="lifehq-premium-card border-white/[0.08] bg-[linear-gradient(135deg,rgba(255,255,255,0.045),rgba(0,0,0,0.16))] p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-[#D6AD64]/65">Life Operating System</p>
          <h2 className="font-serif text-3xl font-semibold tracking-tight text-[#F5F1EA] sm:text-4xl">Life Systems</h2>
          <p className="text-base leading-7 text-[#B8B1A7] sm:text-lg">Die zentralen Systeme deines Lebens.</p>
        </div>
        {!showCreateForm && (
          <button type="button" onClick={() => setShowCreateForm(true)} className="w-fit rounded-full border border-[#D6AD64]/25 px-5 py-2.5 text-sm font-medium text-[#F5D28B] transition hover:border-[#D6AD64]/45 hover:bg-[#D6AD64]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D6AD64]/70">
            Lebenssystem erstellen
          </button>
        )}
      </div>

      {lifeSystems.length === 0 && (
        <div className="mt-8 rounded-3xl border border-white/[0.08] bg-black/15 p-5 sm:p-6">
          <h3 className="font-serif text-2xl font-semibold text-[#F5F1EA]">Baue deine Lebenssysteme auf</h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#B8B1A7]">Lege die zentralen Systeme an, die dein Leben tragen — z. B. Familie, Gesundheit, Zuhause oder Wohlstand.</p>
        </div>
      )}

      {showCreateForm && (
        <form onSubmit={handleSubmit} className="mt-8 max-w-2xl space-y-5 rounded-3xl border border-white/[0.08] bg-black/15 p-4 sm:p-5">
          <div className="space-y-2">
            <label htmlFor="life-system-name" className="text-sm font-medium text-[#F5F1EA]">Name</label>
            <input
              id="life-system-name"
              type="text"
              value={draft.name}
              onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, name: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-base text-[#F5F1EA] outline-none transition placeholder:text-[#7E776E] focus:border-[#D6AD64]/50 focus:ring-2 focus:ring-[#D6AD64]/15"
              placeholder="z. B. Gesundheit, Familie oder Wohlstand"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="life-system-description" className="text-sm font-medium text-[#F5F1EA]">Beschreibung</label>
            <textarea
              id="life-system-description"
              value={draft.description}
              onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, description: event.target.value }))}
              className="min-h-28 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-base leading-7 text-[#F5F1EA] outline-none transition placeholder:text-[#7E776E] focus:border-[#D6AD64]/50 focus:ring-2 focus:ring-[#D6AD64]/15"
              placeholder="Wofür steht dieses Lebenssystem?"
            />
          </div>
          {error && <p className="text-sm text-red-200">{error}</p>}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button type="submit" className="rounded-full bg-[#D6AD64] px-5 py-2.5 text-sm font-semibold text-[#1F1A14] transition hover:bg-[#F0C979] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D6AD64]/70">
              Lebenssystem speichern
            </button>
            {lifeSystems.length > 0 && (
              <button type="button" onClick={() => { setShowCreateForm(false); setDraft(emptyLifeSystemDraft); setError(undefined); }} className="rounded-full border border-white/10 px-5 py-2.5 text-sm font-medium text-[#C9C1B8] transition hover:border-white/20 hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40">
                Abbrechen
              </button>
            )}
          </div>
        </form>
      )}

      {lifeSystems.length > 0 && (
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {lifeSystems.map((lifeSystem) => {
            const projectCount = projects.filter((project) => project.lifeSystemId === lifeSystem.id).length;
            const lifeSystemPhases = getSortedLifeSystemPhases(phases.filter((phase) => phase.lifeSystemId === lifeSystem.id));

            return (
              <LifeSystemCard
                key={lifeSystem.id}
                lifeSystem={lifeSystem}
                phases={lifeSystemPhases}
                projectCount={projectCount}
                onClick={() => setSelectedLifeSystemId(lifeSystem.id)}
              />
            );
          })}
        </div>
      )}

      {selectedLifeSystem && (
        <LifeSystemDetailModal
          lifeSystem={selectedLifeSystem}
          currentPhaseLabel={selectedLifeSystemPhaseLabel}
          projectCount={selectedLifeSystemProjectCount}
          onClose={() => setSelectedLifeSystemId(undefined)}
        />
      )}
    </section>
  );
}


type FocusCardProps = {
  candidate: PrioritizedFocusCandidate;
  lifeSystemName?: string;
  projectName?: string;
  onOpenProject?: () => void;
};

function FocusCard({ candidate, lifeSystemName, projectName, onOpenProject }: FocusCardProps) {
  const accentClass = candidate.priorityLevel === 'critical' ? 'border-l-red-300/55' : 'border-l-[#D6AD64]/40';

  return (
    <article className={`rounded-3xl border border-white/[0.08] border-l-4 ${accentClass} bg-[linear-gradient(135deg,rgba(255,255,255,0.045),rgba(0,0,0,0.18))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)] transition hover:border-white/[0.14] hover:bg-[#D6AD64]/[0.035] sm:p-6`}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-white/10 bg-black/15 px-3 py-1 font-medium text-[#F5F1EA]">
              {focusSourceTypeLabels[candidate.sourceType]}
            </span>
            <span className={`rounded-full border px-3 py-1 font-semibold ${focusPriorityStyles[candidate.priorityLevel]}`}>
              {focusPriorityLabels[candidate.priorityLevel]}
            </span>
          </div>

          <div className="space-y-3">
            <h3 className="font-serif text-2xl font-semibold tracking-tight text-[#F5F1EA] sm:text-3xl">{candidate.title}</h3>
            {candidate.primaryReason && (
              <p className="w-fit rounded-2xl border border-[#D6AD64]/20 bg-[#D6AD64]/[0.07] px-3 py-2 text-sm font-medium text-[#F5D28B]">
                {candidate.primaryReason}
              </p>
            )}
            {candidate.description && <p className="line-clamp-3 max-w-3xl text-sm leading-6 text-[#B8B1A7]">{candidate.description}</p>}
          </div>
        </div>

        {onOpenProject && (
          <button type="button" onClick={onOpenProject} className="w-fit rounded-full border border-[#D6AD64]/25 px-4 py-2 text-sm font-medium text-[#F5D28B] transition hover:border-[#D6AD64]/45 hover:bg-[#D6AD64]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D6AD64]/70">
            Projekt öffnen
          </button>
        )}
      </div>

      {(lifeSystemName || projectName) && (
        <div className="mt-5 grid gap-3 border-t border-white/[0.08] pt-4 text-sm sm:grid-cols-2">
          {lifeSystemName && (
            <div className="rounded-2xl border border-white/[0.08] bg-black/15 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-[#7E776E]">Life System</p>
              <p className="mt-1 font-medium text-[#C9C1B8]">{lifeSystemName}</p>
            </div>
          )}
          {projectName && (
            <div className="rounded-2xl border border-white/[0.08] bg-black/15 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-[#7E776E]">Projekt</p>
              <p className="mt-1 font-medium text-[#C9C1B8]">{projectName}</p>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function FocusDashboardSection() {
  const navigate = useNavigate();
  const projects = useLifeHQStore(selectProjects);
  const tasks = useLifeHQStore(selectTasks);
  const milestones = useLifeHQStore(selectMilestones);
  const lifeSystems = useLifeHQStore(selectLifeSystems);
  const lifeSystemPhases = useLifeHQStore(selectLifeSystemPhases);

  const focusCandidates = useMemo(
    () => buildPrioritizedFocusCandidates({ projects, tasks, milestones, lifeSystems, lifeSystemPhases }).slice(0, 5),
    [lifeSystemPhases, lifeSystems, milestones, projects, tasks],
  );
  const projectsById = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects]);
  const lifeSystemsById = useMemo(() => new Map(lifeSystems.map((lifeSystem) => [lifeSystem.id, lifeSystem])), [lifeSystems]);

  return (
    <section className="lifehq-premium-card border-white/[0.08] bg-[linear-gradient(135deg,rgba(255,255,255,0.045),rgba(0,0,0,0.16))] p-6 sm:p-8">
      <div className="max-w-2xl space-y-3">
        <p className="text-xs uppercase tracking-[0.28em] text-[#D6AD64]/65">Life Operating System</p>
        <h2 className="font-serif text-3xl font-semibold tracking-tight text-[#F5F1EA] sm:text-4xl">Focus</h2>
        <p className="text-base leading-7 text-[#B8B1A7] sm:text-lg">Worauf du dich aktuell konzentrieren solltest.</p>
      </div>

      {focusCandidates.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-white/[0.08] bg-black/15 p-5 sm:p-6">
          <h3 className="font-serif text-2xl font-semibold text-[#F5F1EA]">Kein akuter Fokus erkannt</h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#B8B1A7]">
            Sobald Projekte, Aufgaben, Fristen oder aktive Lebenssystem-Phasen Aufmerksamkeit benötigen, erscheinen sie hier.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4">
          {focusCandidates.map((candidate) => {
            const project = candidate.projectId ? projectsById.get(candidate.projectId) : undefined;
            const lifeSystem = candidate.lifeSystemId ? lifeSystemsById.get(candidate.lifeSystemId) : undefined;

            return (
              <FocusCard
                key={candidate.id}
                candidate={candidate}
                lifeSystemName={lifeSystem?.name}
                projectName={project?.name}
                onOpenProject={candidate.projectId ? () => navigate(`/projects/${candidate.projectId}`) : undefined}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}


export function HqPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pb-[calc(8.5rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 lg:px-8 lg:py-12">
      <main className="space-y-5 sm:space-y-6" aria-label="LifeHQ HQ">
        <VisionHeroSection />
        <LifeSystemsGridSection />
        <FocusDashboardSection />
      </main>
    </div>
  );
}
