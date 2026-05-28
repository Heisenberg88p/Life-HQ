import { Outlet } from 'react-router-dom';
import { AppHeader } from './components/AppHeader';
import { ContentPanel } from './components/ContentPanel';
import { DesktopNavigation } from './components/DesktopNavigation';
import { MobileNavigation } from './components/MobileNavigation';
import { PageContainer } from './components/PageContainer';

export function AppShell() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-surface to-surface-soft text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl bg-slate-950/20">
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
