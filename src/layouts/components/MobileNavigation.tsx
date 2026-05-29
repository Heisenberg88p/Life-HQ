import { MainNavigation } from '../../components/navigation/MainNavigation';

export function MobileNavigation() {
  return (
    <div className="sticky bottom-0 z-10 shrink-0 border-t border-slate-800/80 bg-surface/95 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
      <MainNavigation variant="mobile" />
    </div>
  );
}
