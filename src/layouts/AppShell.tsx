import { Outlet } from 'react-router-dom';
import { AppHeader } from './components/AppHeader';
import { ContentPanel } from './components/ContentPanel';
import { DesktopNavigation } from './components/DesktopNavigation';
import { MobileNavigation } from './components/MobileNavigation';
import { PageContainer } from './components/PageContainer';

export function AppShell() {
  return (
    <div className="min-h-dvh overflow-x-hidden bg-[radial-gradient(circle_at_top_left,_rgba(30,41,59,0.9),_transparent_34rem),linear-gradient(180deg,_#0f172a_0%,_#111827_100%)] text-slate-100">
      <div className="mx-auto flex min-h-dvh w-full max-w-screen-2xl bg-slate-950/10 lg:gap-0">
        <DesktopNavigation />

        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader />
          <PageContainer>
            <ContentPanel>
              <Outlet />
            </ContentPanel>
          </PageContainer>
          <MobileNavigation />
        </div>
      </div>
    </div>
  );
}
