import { MainNavigation } from '../../components/navigation/MainNavigation';

export function MobileNavigation() {
  return (
    <div className="fixed inset-x-2 bottom-[calc(0.5rem+env(safe-area-inset-bottom))] z-30 mx-auto max-w-[min(28rem,calc(100vw-1rem))] lg:hidden">
      <div className="rounded-[1.35rem] border border-white/10 bg-[#030303]/95 p-1.5 sm:rounded-3xl sm:p-2 shadow-2xl shadow-black/35 backdrop-blur-md">
        <MainNavigation variant="mobile" />
      </div>
    </div>
  );
}
