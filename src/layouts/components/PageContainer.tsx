import type { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <div className="mx-auto flex w-full max-w-[1320px] flex-1 flex-col px-4 pb-[calc(8.5rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pb-[calc(8.5rem+env(safe-area-inset-bottom))] lg:px-8 lg:py-10 xl:px-12">
      {children}
    </div>
  );
}
