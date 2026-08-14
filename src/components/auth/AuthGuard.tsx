'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';

// 리프레시 토큰 쿠키 이름/속성을 몰라 미들웨어(proxy.ts)에서는 인증 여부를 판단할 수 없음
// 그래서 클라이언트에서 /auth/refresh 복구 결과(accessToken 유무)로 라우트를 보호
export default function AuthGuard({ children }: { children: React.ReactNode }) {
   const { isAuthenticated, isInitializing, needResetPw } = useAuth();
   const router = useRouter();

   useEffect(() => {
      if (isInitializing) return;
      if (!isAuthenticated) {
         router.replace('/login');
         return;
      }
      // 로그인 페이지에서 뒤로가기 등으로 여기(보호된 화면)까지 들어와도, 비밀번호를
      // 재설정하기 전까지는 강제로 재설정 화면으로 되돌린다. /reset-password는 이
      // 레이아웃(AuthGuard) 밖에 있어 무한 리다이렉트로 이어지지 않는다
      if (needResetPw) {
         router.replace('/reset-password');
      }
   }, [isInitializing, isAuthenticated, needResetPw, router]);

   if (isInitializing || !isAuthenticated || needResetPw) return null;

   return <>{children}</>;
}
