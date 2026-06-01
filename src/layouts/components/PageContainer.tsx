import type { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-3 pb-24 pt-4 sm:px-6 sm:pb-28 sm:pt-6 lg:px-8 lg:py-8">
      {children}
    </div>
  );
}
