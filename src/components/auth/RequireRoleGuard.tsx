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

// 사이드바(Menubar)가 메뉴만 숨길 뿐 URL 직접 접근은 막지 않던 화면들 - 의도가 명확한 곳만 넣는다.
// (팀 이력/상담 상세처럼 사이드바에 링크가 없다는 것만으로는 역할 제한 의도가 불명확한 곳은 제외)
const ROLE_RESTRICTIONS: RoleRestriction[] = [
   // 관리자 설정 - Header.tsx가 매니저에게만 톱니바퀴 아이콘을 보여주는 것과 동일한 의도
   { allowedRoles: ['MANAGER'], matches: (p) => matchesPath(p, '/manager-setting') },
   // 평가 관리 - STAFF_MENU_ITEMS에만 있고 STUDENT_MENU_ITEMS엔 없음
   { allowedRoles: ['MANAGER', 'INSTRUCTOR'], matches: (p) => matchesPath(p, '/evaluations') },
   // 공지 작성/수정 - NoticesPageClient가 강사·매니저에게만 버튼을 보여주는 화면
   {
      allowedRoles: ['MANAGER', 'INSTRUCTOR'],
      matches: (p) => p === '/notices/write' || /^\/notices\/[^/]+\/edit$/.test(p),
   },
   // 훈련생 개별 상세 - 훈련생 본인 화면(/tracker, 세그먼트 없음)은 제외하고 /tracker/{id}만 막는다
   { allowedRoles: ['MANAGER', 'INSTRUCTOR'], matches: (p) => p.startsWith('/tracker/') },
   // 제출 화면 - 강사/매니저가 훈련생인 척 제출하는 것을 막는다
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
   const isBlocked = Boolean(restriction && role !== null && !restriction.allowedRoles.includes(role));

   useEffect(() => {
      if (!isInitializing && isBlocked) router.replace('/');
   }, [isInitializing, isBlocked, router]);

   if (!isInitializing && isBlocked) return null;

   return <>{children}</>;
}
