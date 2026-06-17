const hqSections = [
  {
    title: 'Vision',
    description: 'Deine langfristige Lebensrichtung.',
  },
  {
    title: 'Life Systems',
    description: 'Die zentralen Systeme deines Lebens.',
  },
  {
    title: 'Focus',
    description: 'Die aktuell wichtigsten Themen.',
  },
] as const;

export function HqPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pb-[calc(8.5rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 lg:px-8 lg:py-12">
      <main className="space-y-5 sm:space-y-6" aria-label="LifeHQ HQ">
        {hqSections.map((section) => (
          <section key={section.title} className="lifehq-premium-card border-white/[0.08] bg-[linear-gradient(135deg,rgba(255,255,255,0.045),rgba(0,0,0,0.16))] p-6 sm:p-8">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.28em] text-[#D6AD64]/65">Life Operating System</p>
              <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#F5F1EA] sm:text-4xl">{section.title}</h1>
              <p className="text-base leading-7 text-[#B8B1A7] sm:text-lg">{section.description}</p>
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
