import { API_BASE_URL, ApiError } from '@/lib/http';
import { getServerAccessToken } from './serverAuth';

// 서버 컴포넌트 전용 - getServerAccessToken()으로 받은 토큰을 파라미터로 직접 받는다(클라이언트의
// token-store.ts는 서버 런타임에 존재하지 않아 apiFetch를 그대로 못 씀). 렌더링 1회성이라
// apiFetch에 있는 401 재시도/refresh 로직은 없음 - 실패하면 호출부가 프리페치를 포기하고
// 클라이언트 폴백(기존 useQuery/useEffect)으로 넘어간다
export async function serverApiFetch<T>(path: string, accessToken: string): Promise<T> {
   const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
   });

   if (!res.ok) {
      throw new ApiError(await res.json().catch(() => null), res.status);
   }

   return res.json() as Promise<T>;
}

// 페이지마다 반복되던 "토큰 있으면 프리페치, 없거나 실패하면 undefined로 폴백" 보일러플레이트를
// 한 곳에 모은다. 실패해도 undefined로 폴백해 클라이언트가 그대로 다시 불러오게 하지만, 원인을
// 알 수 없으면 프리페치가 매번 조용히 실패해도 눈치챌 방법이 없으므로 서버 콘솔에는 남긴다
export async function prefetchIfAuthed<T>(
   fetcher: (accessToken: string) => Promise<T>,
): Promise<T | undefined> {
   const accessToken = await getServerAccessToken();
   if (!accessToken) return undefined;
   return fetcher(accessToken).catch((error) => {
      console.error(`[prefetchIfAuthed] ${fetcher.name || 'fetcher'} 실패`, error);
      return undefined;
   });
}
