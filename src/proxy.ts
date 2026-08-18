import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { VERIFIED_AUTH_CACHE_COOKIE } from '@/lib/auth/serverAuth';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');

// (user)/* 안에서 페이지를 옮겨다닐 때마다 매번 백엔드에 검증 요청을 보내면 이동할 때마다
// 100ms 이상의 왕복 지연이 그대로 체감된다(동적 라우트는 Link 프리페치도 전체 콘텐츠까지는
// 안 해줌). 그래서 한 번 검증에 성공하면 그 결과(accessToken 포함)를 이 TTL 동안 쿠키에
// 캐싱해 재검증을 건너뛴다. role/status·데이터 프리페치 둘 다 "어느 화면을 보여줄지/미리
// 뭘 불러올지"에만 쓰는 최적화용 힌트이고, 진짜 인가는 accessToken 자체를 백엔드가 매 요청
// 다시 검사하므로 최대 60초 지연된 상태를 잠깐 더 쓰는 정도는 안전하다
const VERIFIED_CACHE_MAX_AGE_SECONDS = 60;

// (auth)/(setting) 레이아웃은 이 헤더들을 전혀 읽지 않는다 - 검증 자체를 생략해야 정적
// 프리렌더링이 유지되는 그 경로들에서 불필요한 /auth/refresh 백엔드 호출도 같이 피할 수 있다
const PUBLIC_PATH_PREFIXES = ['/login', '/reset-password', '/onboarding-wizard'];

function isPublicPath(pathname: string) {
   return PUBLIC_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

// 쿠키를 그대로 신뢰해 헤더를 세팅한 게 아니라 항상 이 함수가 검증한 결과로만 세팅하므로,
// 클라이언트가 직접 이 헤더들을 보내 서버 컴포넌트를 속이는 걸 막으려면 모든 경로(성공/실패/
// 스킵 전부)에서 원본 요청 헤더에 이미 들어있었을 수 있는 값을 먼저 지워야 한다
function stripVerifiedHeaders(headers: Headers) {
   headers.delete('x-verified-role');
   headers.delete('x-verified-status');
   headers.delete('x-verified-bootcamp-id');
   headers.delete('x-verified-access-token');
}

interface VerifiedAuthData {
   role: string;
   status: string;
   bootcampId: number | null;
   // 캐시 쿠키에도 같이 저장한다 - 그래서 이 쿠키는 httpOnly여야 한다(브라우저 JS가 못 읽게).
   // 캐시 히트 경로에서도 서버 컴포넌트가 프리페치에 쓸 토큰을 받아야 하는데, 캐시 미스일 때만
   // 채워지면 60초 캐시 TTL 동안의 탐색 대부분에서 프리페치가 통째로 스킵돼버린다
   accessToken: string;
}

function applyVerifiedHeaders(headers: Headers, data: VerifiedAuthData) {
   headers.set('x-verified-role', data.role);
   headers.set('x-verified-status', data.status);
   headers.set('x-verified-bootcamp-id', data.bootcampId === null ? '' : String(data.bootcampId));
   headers.set('x-verified-access-token', data.accessToken);
}

export async function proxy(request: NextRequest) {
   const requestHeaders = new Headers(request.headers);
   stripVerifiedHeaders(requestHeaders);

   const { pathname } = request.nextUrl;
   const cookieHeader = request.headers.get('cookie');

   if (isPublicPath(pathname) || !request.cookies.has('refreshToken') || !cookieHeader) {
      return NextResponse.next({ request: { headers: requestHeaders } });
   }

   const cachedRaw = request.cookies.get(VERIFIED_AUTH_CACHE_COOKIE)?.value;
   if (cachedRaw) {
      try {
         const cached = JSON.parse(cachedRaw) as VerifiedAuthData;
         applyVerifiedHeaders(requestHeaders, cached);
         return NextResponse.next({ request: { headers: requestHeaders } });
      } catch {
         // 캐시 값이 깨졌으면 무시하고 아래에서 새로 검증한다
      }
   }

   try {
      // /auth/refresh는 refresh token 자체는 그대로 둔 채 access token만 새로 내려주므로,
      // 여기서 검증차 호출해도 클라이언트(AuthProvider)가 마운트 시 또 호출하는 것과 충돌하지 않는다
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
         method: 'POST',
         headers: { cookie: cookieHeader },
         signal: AbortSignal.timeout(3000),
      });

      if (res.ok) {
         const data = (await res.json()) as VerifiedAuthData;
         applyVerifiedHeaders(requestHeaders, data);
         const response = NextResponse.next({ request: { headers: requestHeaders } });
         // accessToken까지 같이 캐싱하므로 httpOnly 필수(브라우저 JS가 못 읽게) - 로그아웃 시엔
         // JS로 못 지우니 /api/auth/clear-verified-cache 라우트가 대신 지워준다
         response.cookies.set(VERIFIED_AUTH_CACHE_COOKIE, JSON.stringify(data), {
            maxAge: VERIFIED_CACHE_MAX_AGE_SECONDS,
            path: '/',
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
         });
         return response;
      }
      // 401 등 실패면 헤더를 세팅하지 않은 채(= 비로그인 취급) 그대로 통과시킨다 - AuthGuard가
      // 클라이언트에서 다시 판단한다
   } catch {
      // 백엔드 타임아웃/오류 시에도 페이지 자체는 막지 않고, 롤 검증 없이 통과시켜
      // 클라이언트의 기존 /auth/refresh 흐름으로 폴백한다
   }

   return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
   matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
