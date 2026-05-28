import type { ReactNode } from 'react';

interface ContentPanelProps {
  children: ReactNode;
}

export function ContentPanel({ children }: ContentPanelProps) {
  return (
    <main className="flex-1 rounded-3xl border border-slate-700/50 bg-panel/60 p-5 shadow-xl shadow-black/10 backdrop-blur-sm sm:p-6 lg:p-8">
      {children}
    </main>
  );
}
