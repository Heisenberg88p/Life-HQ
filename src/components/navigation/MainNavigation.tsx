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
    <nav
      aria-label="Primary navigation"
      className={
        isMobile
          ? 'grid grid-cols-2 gap-2 rounded-2xl border border-slate-700/60 bg-slate-950/80 p-2 shadow-lg shadow-black/20 backdrop-blur-md'
          : 'flex flex-col gap-2'
      }
    >
      {navigationItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `rounded-xl px-4 py-3 text-sm transition-colors ${
              isActive
                ? 'border border-slate-200/20 bg-slate-100 text-slate-950 shadow-sm'
                : 'border border-transparent text-slate-300 hover:border-slate-700 hover:bg-slate-800/70 hover:text-white'
            }`
          }
        >
          <span className="block font-semibold">{item.label}</span>
          {!isMobile && <span className="mt-1 block text-xs opacity-70">{item.description}</span>}
        </NavLink>
      ))}
    </nav>
  );
}
