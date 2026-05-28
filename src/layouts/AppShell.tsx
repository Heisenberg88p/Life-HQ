import { Outlet } from 'react-router-dom';
import { MainNavigation } from '../components/navigation/MainNavigation';

export function AppShell() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-surface to-surface-soft text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-wide text-slate-200">LifeHQ V1</h1>
          <MainNavigation />
        </header>

        <main className="flex-1 rounded-2xl border border-slate-700/50 bg-panel/60 p-6 shadow-lg shadow-black/10 backdrop-blur-sm">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
