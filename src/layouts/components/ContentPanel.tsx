import type { ReactNode } from 'react';

interface ContentPanelProps {
  children: ReactNode;
}

export function ContentPanel({ children }: ContentPanelProps) {
  return (
    <main className="min-w-0 flex-1">
      {children}
    </main>
  );
}
