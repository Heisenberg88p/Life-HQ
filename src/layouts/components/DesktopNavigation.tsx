import { NavLink } from 'react-router-dom';
import { LifeHQBrand } from '../../components/brand/LifeHQBrand';
import { MainNavigation } from '../../components/navigation/MainNavigation';

export function DesktopNavigation() {
  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-dvh w-64 shrink-0 flex-col border-r border-white/10 bg-[#030303] px-6 py-9 lg:flex xl:w-[17.5rem]">
      <LifeHQBrand className="mb-10" />

      <MainNavigation />

      <div className="mt-8 border-t border-white/10 pt-7 text-sm leading-6 text-[#B8B1A7]">
        <div className="flex gap-3">
          <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#D6AD64]/35 text-xs text-[#D6AD64]" aria-hidden="true">✧</div>
          <div>
            <p className="font-semibold text-[#F5F1EA]">Hinweis</p>
            <p className="mt-1 text-[#B8B1A7]">HQ für Orientierung.</p>
            <p className="text-[#B8B1A7]">Tasks für Umsetzung.</p>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-8">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex min-h-11 items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm font-medium transition-colors ${
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
