import { MainNavigation } from '../../components/navigation/MainNavigation';

export function MobileNavigation() {
  return (
    <div className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-30 mx-auto max-w-[28rem] lg:hidden">
      <div className="rounded-3xl border border-white/10 bg-[#030303]/95 p-2 shadow-2xl shadow-black/35 backdrop-blur-md">
        <MainNavigation variant="mobile" />
      </div>
    </div>
  );
}
