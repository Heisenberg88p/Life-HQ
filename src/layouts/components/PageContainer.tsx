import type { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-[calc(8rem+env(safe-area-inset-bottom))] sm:pt-6 lg:px-8 lg:py-8 xl:py-10">
      {children}
    </div>
  );
}
