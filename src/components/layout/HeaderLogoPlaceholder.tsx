'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthContext';

// AuthGuard가 인증 확인을 마칠 때까지는 FullScreenLoader가 전체 화면을 덮어 Header가 아예
// 렌더링되지 않는다. 그러면 로고 <Image>도 이때까지 DOM에 없어서 priority가 있어도 리소스
// 요청 자체가 늦게 시작된다(LCP의 resource load delay 원인). 이 자리표시자를 AuthGuard 밖에서
// 항상 렌더링해 로고 이미지를 미리 받아두면, 인증이 끝나고 실제 Header가 같은 src의 이미지를
// 그릴 때는 이미 캐시돼 있어 즉시 그려진다. 실제 Header와 동일한 크기라 같은 최적화 URL로
// 캐시가 재사용된다
export default function HeaderLogoPlaceholder() {
   const { isInitializing } = useAuth();

   if (!isInitializing) return null;

   return (
      <header className="z-50 flex h-14 shrink-0 items-center bg-brand-green px-4">
         <Link href="/" className="flex items-center">
            <Image src="/logo/Main-Logo.png" alt="CampFlow" width={100} height={60} priority />
         </Link>
      </header>
   );
}
