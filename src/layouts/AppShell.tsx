import { Outlet } from 'react-router-dom';
import { AppHeader } from './components/AppHeader';
import { ContentPanel } from './components/ContentPanel';
import { LifeHQLaunchIntro } from '../components/brand/LifeHQLaunchIntro';
import { DesktopNavigation } from './components/DesktopNavigation';
import { MobileNavigation } from './components/MobileNavigation';
import { PageContainer } from './components/PageContainer';

export function AppShell() {
  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#030303] text-[#F5F1EA]">
      <LifeHQLaunchIntro />
      <div className="flex min-h-dvh w-full bg-[#030303]">
        <DesktopNavigation />

        <div className="flex min-w-0 flex-1 flex-col bg-[radial-gradient(circle_at_top_right,rgba(214,173,100,0.035),transparent_28%),#060606] lg:pl-64 xl:pl-[17.5rem]">
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
