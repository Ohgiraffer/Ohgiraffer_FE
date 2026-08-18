import { NextResponse } from 'next/server';
import { VERIFIED_AUTH_CACHE_COOKIE } from '@/lib/auth/serverAuth';

// proxy.ts가 롤 검증 결과(accessToken 포함)를 캐싱하는 쿠키는 httpOnly라 브라우저 JS로 지울 수
// 없다 - 로그아웃 시 AuthContext.tsx의 logout()이 이 라우트를 호출해 대신 지워달라고 요청한다
export async function POST() {
   const response = new NextResponse(null, { status: 204 });
   response.cookies.set(VERIFIED_AUTH_CACHE_COOKIE, '', { maxAge: 0, path: '/' });
   return response;
}
