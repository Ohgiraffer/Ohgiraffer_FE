'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import FullScreenLoader from '@/components/ui/loading/FullScreenLoader';

// 미들웨어(proxy.ts)가 쿠키로 롤을 미리 검증해 넘겨주면 role은 즉시 채워지지만, 실제
// accessToken은 클라이언트의 /auth/refresh 왕복이 끝나야 도착한다. 그래서 여기서는
// isAuthenticated(accessToken 유무)가 아니라 role 유무로 로그인 여부를 판단한다 -
// isAuthenticated로 판단하면 그 짧은 틈에 로그인된 사용자를 /login으로 잘못 보내게 된다
export default function AuthGuard({ children }: { children: React.ReactNode }) {
   const { role, isSessionVerified, needResetPw } = useAuth();
   const router = useRouter();
   const isLoggedIn = role !== null;

   useEffect(() => {
      if (!isSessionVerified) return;
      if (!isLoggedIn) {
         router.replace('/login');
         return;
      }
      // 로그인 페이지에서 뒤로가기 등으로 여기(보호된 화면)까지 들어와도, 비밀번호를
      // 재설정하기 전까지는 강제로 재설정 화면으로 되돌린다. /reset-password는 이
      // 레이아웃(AuthGuard) 밖에 있어 무한 리다이렉트로 이어지지 않는다
      if (needResetPw) {
         router.replace('/reset-password');
      }
   }, [isSessionVerified, isLoggedIn, needResetPw, router]);

   if (!isSessionVerified || !isLoggedIn || needResetPw) return <FullScreenLoader />;

   return <>{children}</>;
}
