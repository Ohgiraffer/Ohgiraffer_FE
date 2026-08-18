import { headers } from 'next/headers';

// proxy.ts가 캐시 미스(방금 실제로 백엔드를 검증한) 경로에서만 채워주는 짧은 수명의 액세스 토큰.
// getVerifiedRole.ts(InitialAuth)와는 절대 같은 객체/타입으로 합치지 않는다 - InitialAuth는
// 클라이언트 컴포넌트(AuthProvider)에 prop으로 넘어가 RSC 페이로드에 실려 브라우저까지 도달하는
// 값이라, 이 토큰이 실수로라도 거기 섞이면 브라우저로 새어나간다. 이 함수는 서버 컴포넌트 안에서
// 백엔드를 직접 호출하는 용도로만 쓰고, 반환값을 클라이언트 컴포넌트에 prop으로 넘기면 안 된다
export async function getServerAccessToken(): Promise<string | null> {
   const headerList = await headers();
   return headerList.get('x-verified-access-token') || null;
}
