import { MainNavigation } from '../../components/navigation/MainNavigation';

export function DesktopNavigation() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col border-r border-slate-800/70 bg-slate-950/45 px-5 py-6 backdrop-blur-sm lg:flex xl:w-80">
      <div className="lifehq-card-soft mb-6 p-4">
        <p className="lifehq-label">Main Areas</p>
        <p className="mt-3 text-sm leading-6 text-slate-400">Strategic overview and operational execution.</p>
      </div>
      <MainNavigation />
      <div className="mt-auto pt-6 text-xs leading-5 text-slate-500">
        <p>HQ for orientation.</p>
        <p>Tasks for execution.</p>
      </div>
    </aside>
  );
}
