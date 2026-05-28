import { MainNavigation } from '../../components/navigation/MainNavigation';

export function DesktopNavigation() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-800/80 bg-slate-950/40 px-5 py-6 lg:block">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Main Areas</p>
        <p className="mt-2 text-sm text-slate-400">Strategic overview and operational execution.</p>
      </div>
      <MainNavigation />
    </aside>
  );
}
