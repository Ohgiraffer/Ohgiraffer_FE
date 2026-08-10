// 헤더 + 사이드바 기본 레이아웃
import AuthGuard from '@/components/auth/AuthGuard';
import Header from '@/components/layout/Header';
import Menubar from '@/components/layout/Menubar';
import SendbirdProvider from '@/features/chat/components/SendbirdProvider';

export default function UserLayout({ children }: { children: React.ReactNode }) {
   return (
      <AuthGuard>
         <SendbirdProvider>
            <div className="flex min-h-screen flex-col">
               <Header />
               <div className="flex flex-1">
                  <Menubar />
                  <main className="flex-1 bg-[#F7F8FA]">{children}</main>
               </div>
            </div>
         </SendbirdProvider>
      </AuthGuard>
   );
}
