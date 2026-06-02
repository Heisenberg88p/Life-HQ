import { MainNavigation } from '../../components/navigation/MainNavigation';

export function MobileNavigation() {
  return (
    <div className="fixed inset-x-3 bottom-3 z-30 lg:hidden">
      <div className="rounded-3xl border border-slate-700/70 bg-surface/95 p-2 shadow-2xl shadow-black/35 backdrop-blur-md">
        <MainNavigation variant="mobile" />
      </div>
    </div>
  );
}
