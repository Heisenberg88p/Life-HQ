import { NavLink } from 'react-router-dom';

const items = [
  { to: '/hq', label: 'HQ' },
  { to: '/tasks', label: 'Tasks' },
];

export function MainNavigation() {
  return (
    <nav aria-label="Primary" className="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-900/40 p-1">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isActive ? 'bg-slate-200 text-slate-900' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
