import { NavLink } from 'react-router-dom';

type NavigationVariant = 'desktop' | 'mobile';

const navigationItems = [
  { to: '/hq', label: 'HQ', description: 'Strategie', icon: '▦' },
  { to: '/tasks', label: 'Tasks', description: 'Umsetzung', icon: '☑' },
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
              isMobile ? 'min-h-14 px-3 py-3 text-center' : 'min-h-[3.5rem] px-4 py-3 text-left'
            } ${
              isActive
                ? 'border-[#D6AD64]/30 bg-[#D6AD64]/10 text-[#F5F1EA] shadow-[inset_3px_0_0_rgba(214,173,100,0.95)]'
                : 'border-transparent bg-transparent text-[#B8B1A7] hover:border-[#D6AD64]/20 hover:bg-white/[0.035] hover:text-[#F5F1EA]'
            }`
          }
        >
          {({ isActive }) => (
            <span className={`flex min-w-0 items-center ${isMobile ? 'justify-center gap-2' : 'gap-3'}`}>
              <span className={isActive ? 'text-[#D6AD64]' : 'text-[#7E776E]'} aria-hidden="true">{item.icon}</span>
              <span className="min-w-0">
                <span className="block truncate font-semibold leading-5">{item.label}</span>
                <span className={`mt-0.5 block truncate text-xs leading-4 ${isActive ? 'text-[#D6AD64]/75' : 'text-[#7E776E]'} ${isMobile ? 'text-[0.7rem]' : ''}`}>{item.description}</span>
              </span>
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
