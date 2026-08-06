'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';

// 리프레시 토큰 쿠키 이름/속성을 몰라 미들웨어(proxy.ts)에서는 인증 여부를 판단할 수 없다.
// 그래서 클라이언트에서 /auth/refresh 복구 결과(accessToken 유무)로 라우트를 보호한다.
export default function AuthGuard({ children }: { children: React.ReactNode }) {
   const { isAuthenticated, isInitializing } = useAuth();
   const router = useRouter();

   useEffect(() => {
      if (!isInitializing && !isAuthenticated) {
         router.replace('/login');
      }
   }, [isInitializing, isAuthenticated, router]);

   if (isInitializing || !isAuthenticated) return null;

   return <>{children}</>;
}
