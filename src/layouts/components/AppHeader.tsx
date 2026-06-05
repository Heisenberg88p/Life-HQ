import { Link } from 'react-router-dom';

export function AppHeader() {
  return (
    <header className="shrink-0 border-b border-white/10 bg-[#030303]/95 px-5 py-3 backdrop-blur-sm sm:px-6 lg:hidden">
      <div className="flex w-full items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.65rem] uppercase tracking-[0.2em] text-[#7E776E]">Life Operating System</p>
          <h1 className="truncate text-sm font-semibold tracking-wide text-[#F5F1EA]">LifeHQ <span className="text-[#D6AD64]">V1</span></h1>
        </div>
        <Link
          to="/settings"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-[#B8B1A7] transition-colors hover:border-[#D6AD64]/25 hover:text-[#D6AD64]"
          aria-label="Einstellungen öffnen"
        >
          <span aria-hidden="true">⚙</span>
        </Link>
      </div>
    </header>
  );
}
