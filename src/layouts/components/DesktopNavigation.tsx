import { NavLink } from 'react-router-dom';
import { LifeHQBrand } from '../../components/brand/LifeHQBrand';
import { MainNavigation } from '../../components/navigation/MainNavigation';

export function DesktopNavigation() {
  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-dvh w-64 shrink-0 flex-col border-r border-white/[0.08] bg-[linear-gradient(180deg,#050505_0%,#030303_58%,#070604_100%)] px-5 py-8 shadow-[18px_0_80px_rgba(0,0,0,0.24)] lg:flex xl:w-[17.5rem]">
      <LifeHQBrand className="mb-11 px-1" />

      <MainNavigation />

      <div className="mt-8 rounded-3xl border border-white/[0.07] bg-white/[0.018] p-4 text-sm leading-6 text-[#B8B1A7]">
        <div className="flex gap-3">
          <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#D6AD64]/35 text-xs text-[#D6AD64]" aria-hidden="true">✧</div>
          <div>
            <p className="font-semibold text-[#F5F1EA]">Hinweis</p>
            <p className="mt-1 text-[#B8B1A7]">HQ für Orientierung.</p>
            <p className="text-[#B8B1A7]">Aufgaben für Umsetzung.</p>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-8">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex min-h-12 items-center gap-3 rounded-2xl border px-3.5 py-3 text-sm font-medium transition-[background-color,border-color,color,transform] duration-200 ease-out ${
              isActive
                ? 'border-[#D6AD64]/30 bg-[#D6AD64]/10 text-[#F5F1EA]'
                : 'border-white/10 bg-white/[0.02] text-[#B8B1A7] hover:border-[#D6AD64]/25 hover:bg-white/[0.035] hover:text-[#F5F1EA]'
            }`
          }
          aria-label="Einstellungen öffnen"
        >
          {({ isActive }) => (
            <>
              <span className={isActive ? 'text-[#D6AD64]' : 'text-[#7E776E]'} aria-hidden="true">⚙</span>
              <span>Einstellungen</span>
            </>
          )}
        </NavLink>
      </div>
    </aside>
  );
}
