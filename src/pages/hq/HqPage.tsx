import { useState, type FormEvent } from 'react';
import type { LifeSystem } from '../../models/lifeSystem';
import type { LifeSystemPhase } from '../../models/lifeSystemPhase';
import type { Vision } from '../../models/vision';
import { selectLifeSystemPhases, selectLifeSystems, selectProjects, selectVisions, useLifeHQStore } from '../../store';

type VisionDraft = {
  title: string;
  description: string;
};

type LifeSystemDraft = {
  name: string;
  description: string;
};

const focusPlaceholder = {
  title: 'Focus',
  description: 'Die aktuell wichtigsten Themen.',
} as const;

const createEntityId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const createVisionId = () => createEntityId('vision');
const createLifeSystemId = () => createEntityId('life-system');

const createVisionDraft = (vision?: Vision): VisionDraft => ({
  title: vision?.title ?? '',
  description: vision?.description ?? '',
});

const emptyLifeSystemDraft: LifeSystemDraft = { name: '', description: '' };

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


function getCurrentPhaseLabel(lifeSystem: LifeSystem, phases: LifeSystemPhase[]): string {
  if (!lifeSystem.currentPhaseId) {
    return 'Keine aktuelle Phase';
  }

  return phases.find((phase) => phase.id === lifeSystem.currentPhaseId && phase.lifeSystemId === lifeSystem.id)?.title ?? 'Phase nicht gefunden';
}

function LifeSystemCard({ lifeSystem, currentPhaseLabel, projectCount, onClick }: { lifeSystem: LifeSystem; currentPhaseLabel: string; projectCount: number; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="lifehq-premium-card w-full border-white/[0.08] bg-[linear-gradient(135deg,rgba(255,255,255,0.045),rgba(0,0,0,0.16))] p-5 text-left transition hover:border-[#D6AD64]/30 hover:bg-[#D6AD64]/[0.045] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D6AD64]/70 sm:p-6">
      <div className="space-y-5">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.24em] text-[#D6AD64]/60">Life System</p>
          <h3 className="font-serif text-2xl font-semibold tracking-tight text-[#F5F1EA]">{lifeSystem.name}</h3>
          {lifeSystem.description && <p className="text-sm leading-6 text-[#B8B1A7]">{lifeSystem.description}</p>}
        </div>

        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-2xl border border-white/[0.08] bg-black/15 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-[#7E776E]">Aktuelle Phase</p>
            <p className="mt-2 font-medium text-[#F5F1EA]">{currentPhaseLabel}</p>
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
  const updateLifeSystem = useLifeHQStore((state) => state.updateLifeSystem);
  const deleteLifeSystem = useLifeHQStore((state) => state.deleteLifeSystem);
  const [draft, setDraft] = useState<LifeSystemDraft>({ name: lifeSystem.name, description: lifeSystem.description ?? '' });
  const [error, setError] = useState<string>();

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
  };

  const handleDelete = () => {
    if (!window.confirm(`Lebenssystem "${lifeSystem.name}" wirklich löschen?`)) {
      return;
    }

    deleteLifeSystem(lifeSystem.id);
    onClose();
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

            return (
              <LifeSystemCard
                key={lifeSystem.id}
                lifeSystem={lifeSystem}
                currentPhaseLabel={getCurrentPhaseLabel(lifeSystem, phases)}
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

function PlaceholderSection({ title, description }: { title: string; description: string }) {
  return (
    <section className="lifehq-premium-card border-white/[0.08] bg-[linear-gradient(135deg,rgba(255,255,255,0.045),rgba(0,0,0,0.16))] p-6 sm:p-8">
      <div className="max-w-2xl space-y-3">
        <p className="text-xs uppercase tracking-[0.28em] text-[#D6AD64]/65">Life Operating System</p>
        <h2 className="font-serif text-3xl font-semibold tracking-tight text-[#F5F1EA] sm:text-4xl">{title}</h2>
        <p className="text-base leading-7 text-[#B8B1A7] sm:text-lg">{description}</p>
      </div>
    </section>
  );
}

export function HqPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pb-[calc(8.5rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 lg:px-8 lg:py-12">
      <main className="space-y-5 sm:space-y-6" aria-label="LifeHQ HQ">
        <VisionHeroSection />
        <LifeSystemsGridSection />
        <PlaceholderSection title={focusPlaceholder.title} description={focusPlaceholder.description} />
      </main>
    </div>
  );
}
