import { MainNavigation } from '../../components/navigation/MainNavigation';

export function DesktopNavigation() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-slate-800/80 bg-slate-950/40 px-5 py-6 lg:flex xl:w-72">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Main Areas</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">Strategic overview and operational execution.</p>
      </div>
      <MainNavigation />
    </aside>
  );
}
