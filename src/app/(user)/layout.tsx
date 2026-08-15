// 헤더 + 사이드바 기본 레이아웃
import AuthGuard from '@/components/auth/AuthGuard';
import RequireOnboardingGuard from '@/components/auth/RequireOnboardingGuard';
import RequireRoleGuard from '@/components/auth/RequireRoleGuard';
import Header from '@/components/layout/Header';
import Menubar from '@/components/layout/Menubar';
import { SidePanelProvider } from '@/components/layout/SidePanelContext';
import SendbirdProvider from '@/features/chat/components/SendbirdProvider';

export default function UserLayout({ children }: { children: React.ReactNode }) {
   return (
      <AuthGuard>
         <RequireOnboardingGuard>
            <RequireRoleGuard>
               <SendbirdProvider>
                  <SidePanelProvider>
                     <div className="flex h-screen flex-col overflow-hidden">
                        <Header />
                        <div className="flex flex-1 overflow-hidden">
                           <Menubar />
                           <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F7F8FA]">
                              {children}
                           </main>
                        </div>
                     </div>
                  </SidePanelProvider>
               </SendbirdProvider>
            </RequireRoleGuard>
         </RequireOnboardingGuard>
      </AuthGuard>
   );
}
