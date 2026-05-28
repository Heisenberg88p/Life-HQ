import { MainNavigation } from '../../components/navigation/MainNavigation';

export function MobileNavigation() {
  return (
    <div className="sticky bottom-0 z-10 border-t border-slate-800/80 bg-surface/90 p-3 backdrop-blur lg:hidden">
      <MainNavigation variant="mobile" />
    </div>
  );
}
