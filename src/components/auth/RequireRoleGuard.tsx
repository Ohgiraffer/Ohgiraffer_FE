'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import type { UserRole } from '@/services/auth.service';

// prefix가 실제 경로 세그먼트 경계에서 끝나는지까지 확인 (예: '/team'이 '/teamwork'에 안 걸리게)
function matchesPath(pathname: string, prefix: string): boolean {
   return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

interface RoleRestriction {
   allowedRoles: UserRole[];
   matches: (pathname: string) => boolean;
}

const ROLE_RESTRICTIONS: RoleRestriction[] = [
   // 관리자 설정
   { allowedRoles: ['MANAGER'], matches: (p) => matchesPath(p, '/manager-setting') },
   // 평가 관리
   { allowedRoles: ['MANAGER', 'INSTRUCTOR'], matches: (p) => matchesPath(p, '/evaluations') },
   // 공지 작성/수정
   {
      allowedRoles: ['MANAGER', 'INSTRUCTOR'],
      matches: (p) => p === '/notices/write' || /^\/notices\/[^/]+\/edit$/.test(p),
   },
   // 훈련생 개별 상세
   { allowedRoles: ['MANAGER', 'INSTRUCTOR'], matches: (p) => p.startsWith('/tracker/') },
   // 제출 화면
   {
      allowedRoles: ['STUDENT'],
      matches: (p) => /^\/submissions\/boxes\/[^/]+\/submit$/.test(p),
   },
];

export default function RequireRoleGuard({ children }: { children: React.ReactNode }) {
   const pathname = usePathname();
   const router = useRouter();
   const { role, isInitializing } = useAuth();

   const restriction = ROLE_RESTRICTIONS.find((r) => r.matches(pathname));
   const isBlocked = Boolean(
      restriction && (isInitializing || role === null || !restriction.allowedRoles.includes(role)),
   );

   useEffect(() => {
      if (!isInitializing && isBlocked) router.replace('/');
   }, [isInitializing, isBlocked, router]);

   if (isBlocked) return null;

   return <>{children}</>;
}
