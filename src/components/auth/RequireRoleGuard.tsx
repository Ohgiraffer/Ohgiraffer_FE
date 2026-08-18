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

// AuthGuard와 동일한 이유로 isInitializing이 아니라 isSessionVerified를 기준으로 삼는다 -
// initialAuth로 role이 이미 채워져 있는데도 isInitializing만 보고 기다리면, AuthGuard는
// 통과했는데 바로 다음 단계인 여기서 또 빈 화면으로 막혀 깜빡임 제거 효과가 무의미해진다
export default function RequireRoleGuard({ children }: { children: React.ReactNode }) {
   const pathname = usePathname();
   const router = useRouter();
   const { role, isSessionVerified } = useAuth();

   const restriction = ROLE_RESTRICTIONS.find((r) => r.matches(pathname));
   const isBlocked = Boolean(
      restriction && (!isSessionVerified || role === null || !restriction.allowedRoles.includes(role)),
   );

   useEffect(() => {
      if (isSessionVerified && isBlocked) router.replace('/');
   }, [isSessionVerified, isBlocked, router]);

   if (isBlocked) return null;

   return <>{children}</>;
}
