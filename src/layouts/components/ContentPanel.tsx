import type { ReactNode } from 'react';

interface ContentPanelProps {
  children: ReactNode;
}

export function ContentPanel({ children }: ContentPanelProps) {
  return (
    <main className="lifehq-panel-strong min-w-0 flex-1 p-4 backdrop-blur-sm sm:p-6 lg:min-h-[calc(100dvh-9rem)] lg:p-8 xl:p-10">
      {children}
    </main>
  );
}
