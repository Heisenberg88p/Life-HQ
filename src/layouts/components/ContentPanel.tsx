import type { ReactNode } from 'react';

interface ContentPanelProps {
  children: ReactNode;
}

export function ContentPanel({ children }: ContentPanelProps) {
  return (
    <main className="min-w-0 flex-1 rounded-2xl border border-slate-700/50 bg-panel/60 p-4 shadow-xl shadow-black/10 backdrop-blur-sm sm:rounded-3xl sm:p-6 lg:p-8">
      {children}
    </main>
  );
}
