import { headers } from 'next/headers';
import type { UserRole } from '@/services/auth.service';
import type { InitialAuth } from '@/components/auth/AuthContext';

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
