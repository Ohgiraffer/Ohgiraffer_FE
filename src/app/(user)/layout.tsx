// 헤더 + 사이드바 기본 레이아웃
import { AuthProvider } from '@/components/auth/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';
import RequireOnboardingGuard from '@/components/auth/RequireOnboardingGuard';
import RequireRoleGuard from '@/components/auth/RequireRoleGuard';
import Header from '@/components/layout/Header';
import HeaderLogoPlaceholder from '@/components/layout/HeaderLogoPlaceholder';
import Menubar from '@/components/layout/Menubar';
import { SidePanelProvider } from '@/components/layout/SidePanelContext';
import SendbirdProvider from '@/features/chat/components/SendbirdProvider';
import { getVerifiedRole } from '@/lib/auth/serverAuth';

// headers()를 여기서만 호출한다 - 이 레이아웃 서브트리((user)/*)만 동적 렌더링이 되고,
// /login·/reset-password·/onboarding-wizard는 headers()를 안 쓰는 루트 레이아웃의
// AuthProvider를 그대로 쓰므로 정적 프리렌더링을 유지한다. 이 아래 컴포넌트들은 이 안쪽
// AuthProvider를 쓰게 되고(Context는 안쪽이 이김), 루트의 바깥쪽 AuthProvider도 여전히
// 마운트돼 자기 몫의 /auth/refresh를 한 번 더 부르지만 아무도 그 결과를 읽지 않는다
export default async function UserLayout({ children }: { children: React.ReactNode }) {
   const initialAuth = await getVerifiedRole();

   return (
      <>
         <HeaderLogoPlaceholder />
         <AuthProvider initialAuth={initialAuth}>
            <AuthGuard>
               <RequireOnboardingGuard>
                  <RequireRoleGuard>
                     <SendbirdProvider>
                        <SidePanelProvider>
                           <div className="flex h-screen flex-col overflow-hidden">
                              <Header />
                              <div className="flex flex-1 overflow-hidden">
                                 <Menubar />
                                 {/* scrollbar-gutter: stable - 콘텐츠 높이가 바뀌어 스크롤바가
                                    나타났다 사라졌다 할 때마다 콘텐츠 너비가 같이 출렁이는 걸 막는다.
                                    스크롤이 필요 없을 때도 스크롤바 자리만큼 항상 여백을 남겨둔다 */}
                                 <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F7F8FA] scrollbar-gutter-stable">
                                    {children}
                                 </main>
                              </div>
                           </div>
                        </SidePanelProvider>
                     </SendbirdProvider>
                  </RequireRoleGuard>
               </RequireOnboardingGuard>
            </AuthGuard>
         </AuthProvider>
      </>
   );
}
