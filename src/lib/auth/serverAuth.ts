import { headers } from 'next/headers';
import type { UserRole } from '@/services/auth.service';
import type { InitialAuth } from '@/components/auth/AuthContext';

// proxy.ts와 AuthContext.tsx(로그아웃 시 정리)가 같은 쿠키 이름을 참조해야 해서 상수로 분리
export const VERIFIED_AUTH_CACHE_COOKIE = 'verifiedAuthCache';

// proxy.ts가 쿠키로 검증해 넣어준 헤더를 서버 컴포넌트에서 읽는다. 헤더가 없거나(비로그인,
// 백엔드 타임아웃 등) 값이 비어 있으면 전부 null로 취급 - 호출부는 클라이언트 쪽 AuthGuard의
// 최종 판단으로 폴백하면 된다(이 값은 어디까지나 서버 렌더링 시점의 최적화용 힌트)
export async function getVerifiedRole(): Promise<InitialAuth | null> {
   const headerList = await headers();
   const role = headerList.get('x-verified-role');
   const status = headerList.get('x-verified-status');
   const bootcampIdHeader = headerList.get('x-verified-bootcamp-id');

   if (!role || !status) return null;

   return {
      role: role as UserRole,
      status,
      bootcampId: bootcampIdHeader === null || bootcampIdHeader === '' ? null : Number(bootcampIdHeader),
   };
}

// proxy.ts가 캐시 미스(방금 실제로 백엔드를 검증한) 경로에서만 채워주는 짧은 수명의 액세스 토큰.
// getVerifiedRole()의 반환값(InitialAuth)과는 절대 같은 객체/타입으로 합치지 않는다 - InitialAuth는
// 클라이언트 컴포넌트(AuthProvider)에 prop으로 넘어가 RSC 페이로드에 실려 브라우저까지 도달하는
// 값이라, 이 토큰이 실수로라도 거기 섞이면 브라우저로 새어나간다. 이 함수는 서버 컴포넌트 안에서
// 백엔드를 직접 호출하는 용도로만 쓰고, 반환값을 클라이언트 컴포넌트에 prop으로 넘기면 안 된다
export async function getServerAccessToken(): Promise<string | null> {
   const headerList = await headers();
   return headerList.get('x-verified-access-token') || null;
}
