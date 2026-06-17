import { useState, type FormEvent } from 'react';
import type { Vision } from '../../models/vision';
import { selectVisions, useLifeHQStore } from '../../store';

type VisionDraft = {
  title: string;
  description: string;
};

const placeholderSections = [
  {
    title: 'Life Systems',
    description: 'Die zentralen Systeme deines Lebens.',
  },
  {
    title: 'Focus',
    description: 'Die aktuell wichtigsten Themen.',
  },
] as const;

const createVisionId = () => `vision-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createVisionDraft = (vision?: Vision): VisionDraft => ({
  title: vision?.title ?? '',
  description: vision?.description ?? '',
});

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
        {placeholderSections.map((section) => (
          <PlaceholderSection key={section.title} title={section.title} description={section.description} />
        ))}
      </main>
    </div>
  );
}
