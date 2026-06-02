import { NavLink } from 'react-router-dom';

type NavigationVariant = 'desktop' | 'mobile';

const navigationItems = [
  { to: '/hq', label: 'HQ', description: 'Strategy' },
  { to: '/tasks', label: 'Tasks', description: 'Execution' },
];

interface MainNavigationProps {
  variant?: NavigationVariant;
}

export function MainNavigation({ variant = 'desktop' }: MainNavigationProps) {
  const isMobile = variant === 'mobile';

  return (
    <nav aria-label="Primary navigation" className={isMobile ? 'grid grid-cols-2 gap-2' : 'flex flex-col gap-2'}>
      {navigationItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `min-w-0 rounded-2xl border text-sm font-medium transition-colors focus-visible:outline-offset-4 ${
              isMobile ? 'min-h-14 px-3 py-3 text-center' : 'min-h-16 px-4 py-3 text-left'
            } ${
              isActive
                ? 'border-slate-200/25 bg-slate-100 text-slate-950 shadow-sm shadow-black/10'
                : 'border-slate-700/30 bg-slate-950/20 text-slate-300 hover:border-slate-600/80 hover:bg-slate-900/65 hover:text-white'
            }`
          }
        >
          <span className="block truncate font-semibold leading-5">{item.label}</span>
          <span className={`mt-1 block truncate text-xs leading-4 opacity-70 ${isMobile ? 'text-[0.7rem]' : ''}`}>{item.description}</span>
        </NavLink>
      ))}
    </nav>
  );
}
