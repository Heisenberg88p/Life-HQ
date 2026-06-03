import { MainNavigation } from '../../components/navigation/MainNavigation';

export function DesktopNavigation() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-white/10 bg-[#030303] px-6 py-9 lg:flex xl:w-[17.5rem]">
      <div className="mb-10 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D6AD64]/35 bg-[#D6AD64]/10 text-lg text-[#D6AD64]" aria-hidden="true">✦</div>
        <div className="flex items-baseline gap-2">
          <p className="font-serif text-2xl font-semibold tracking-tight text-[#F5F1EA]">LifeHQ</p>
          <p className="text-sm font-medium text-[#D6AD64]">V1</p>
        </div>
      </div>

      <MainNavigation />

      <div className="mt-auto border-t border-white/10 pt-7 text-sm leading-6 text-[#B8B1A7]">
        <div className="flex gap-3">
          <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#D6AD64]/35 text-xs text-[#D6AD64]" aria-hidden="true">✧</div>
          <div>
            <p className="font-semibold text-[#F5F1EA]">Hinweis</p>
            <p className="mt-1 text-[#B8B1A7]">HQ für Orientierung.</p>
            <p className="text-[#B8B1A7]">Tasks für Umsetzung.</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
