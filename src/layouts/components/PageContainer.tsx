import type { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <div className="flex w-full max-w-[1320px] flex-1 flex-col px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 sm:pb-[calc(8rem+env(safe-area-inset-bottom))] lg:px-10 lg:py-10 xl:px-12">
      {children}
    </div>
  );
}
