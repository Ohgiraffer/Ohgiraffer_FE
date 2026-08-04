// 헤더 + 사이드바 기본 레이아웃
import Header from '@/components/layout/Header';

export default function UserLayout({ children }: { children: React.ReactNode }) {
   return (
      <>
         <Header />
         <main>{children}</main>
      </>
   );
}
