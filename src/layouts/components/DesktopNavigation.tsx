import { NavLink } from 'react-router-dom';
import { MainNavigation } from '../../components/navigation/MainNavigation';

function BrandTreeIcon() {
  return (
    <svg className="h-8 w-8 text-[#D6AD64]" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 27V15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 16C11.8 16 8.5 13.4 7.7 9.2C11.5 8.7 15 10.8 16 14.2C17 10.8 20.5 8.7 24.3 9.2C23.5 13.4 20.2 16 16 16Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M16 13.5C13.7 12.3 12.6 9.8 13.2 6.6C15.1 7.1 16.4 8.5 16.9 10.2C17.7 8.6 19.3 7.6 21.2 7.5C21.2 10.4 19.3 12.8 16 13.5Z" fill="currentColor" opacity="0.28" />
      <path d="M11 27H21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function DesktopNavigation() {
  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-dvh w-64 shrink-0 flex-col border-r border-white/10 bg-[#030303] px-6 py-9 lg:flex xl:w-[17.5rem]">
      <div className="mb-10 flex items-center gap-3">
        <div className="lifehq-brand-tree" aria-hidden="true"><BrandTreeIcon /></div>
        <div className="flex items-baseline gap-2">
          <p className="font-serif text-2xl font-semibold tracking-tight text-[#F5F1EA]">LifeHQ</p>
          <p className="text-sm font-medium text-[#D6AD64]">V1</p>
        </div>
      </div>

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
