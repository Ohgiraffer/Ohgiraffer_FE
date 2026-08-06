import { getAccessToken, setAccessToken } from '@/lib/auth/token-store';

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');

export interface ApiErrorBody {
   timestamp?: string;
   status?: number;
   code?: string;
   message?: string;
   path?: string;
   traceId?: string;
   errors?: Record<string, string>;
}

export class ApiError extends Error {
   status: number;
   code: string;
   errors: Record<string, string>;

   constructor(body: ApiErrorBody | null, fallbackStatus: number) {
      super(body?.message || '요청 처리 중 오류가 발생했습니다.');
      this.status = body?.status ?? fallbackStatus;
      this.code = body?.code ?? 'UNKNOWN';
      this.errors = body?.errors ?? {};
   }
}

async function rawRequest(path: string, options: RequestInit = {}) {
   return fetch(`${BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
   });
}

export interface RefreshApiData {
   userId: number;
   accessToken: string;
   role: string;
   status: string;
}

// 동시에 여러 요청이 401을 받아도 /auth/refresh는 한 번만 나가도록 진행 중인 요청을 공유
let refreshPromise: Promise<RefreshApiData> | null = null;

// role/status까지 포함한 응답 전체를 돌려줌
// (apiFetch의 401 재시도는 accessToken만 쓰지만, 
// AuthContext가 세션 복구 시 role/status를 다시 세팅하려면 전체 데이터가 필요)
export async function refreshAccessToken(): Promise<RefreshApiData> {
   if (!refreshPromise) {
      refreshPromise = rawRequest('/auth/refresh', { method: 'POST' })
         .then(async (res) => {
            if (!res.ok) throw new ApiError(await res.json().catch(() => null), res.status);
            const data = (await res.json()) as RefreshApiData;
            setAccessToken(data.accessToken);
            return data;
         })
         .finally(() => {
            refreshPromise = null;
         });
   }
   return refreshPromise;
}

interface ApiFetchOptions extends RequestInit {
   /** 로그인 요청처럼 아직 토큰이 없는 호출에서 Authorization 헤더를 붙이지 않음 */
   skipAuth?: boolean;
   /** refresh/logout 자기 자신처럼 401을 받아도 재시도하면 안 되는 호출에서 사용 */
   skipRefreshRetry?: boolean;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
   const { skipAuth, skipRefreshRetry, headers, ...rest } = options;

   const buildHeaders = (): HeadersInit => ({
      ...(rest.body && !(rest.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(!skipAuth && getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
      ...headers,
   });

   let res = await rawRequest(path, { ...rest, headers: buildHeaders() });

   if (res.status === 401 && !skipAuth && !skipRefreshRetry) {
      try {
         await refreshAccessToken();
         res = await rawRequest(path, { ...rest, headers: buildHeaders() });
      } catch {
         setAccessToken(null);
      }
   }

   if (res.status === 204) return undefined as T;

   const data = await res.json().catch(() => null);

   if (!res.ok) {
      throw new ApiError(data, res.status);
   }

   return data as T;
}
