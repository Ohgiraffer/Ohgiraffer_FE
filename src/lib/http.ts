import { getAccessToken, getSessionEpoch, setAccessToken } from '@/lib/auth/token-store';

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');
// 백엔드가 상대 경로로만 내려주는 리소스(공지 본문 이미지 등)를 <img src="...">에 쓸 수 있는
// 절대 주소로 만들 때 씀 - apiFetch는 이미 상대 경로 기준으로 동작해서 내부적으로는 필요 없음
export const API_BASE_URL = BASE_URL;

export interface ApiErrorBody {
   timestamp?: string;
   status?: number;
   code?: string;
   message?: string;
   path?: string;
   traceId?: string;
   errors?: Record<string, string>;
   // 409(채팅방 중복 생성 등) 응답처럼 errors 대신 별도 데이터를 함께 내려주는 경우용
   data?: Record<string, unknown>;
}

export class ApiError extends Error {
   status: number;
   code: string;
   errors: Record<string, string>;
   data: Record<string, unknown> | undefined;

   constructor(body: ApiErrorBody | null, fallbackStatus: number) {
      super(body?.message || '요청 처리 중 오류가 발생했습니다.');
      this.status = body?.status ?? fallbackStatus;
      this.code = body?.code ?? 'UNKNOWN';
      this.errors = body?.errors ?? {};
      this.data = body?.data;
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

// 동시에 여러 요청이 401을 받아도 /auth/refresh는 한 번만 나가도록 진행 중인 요청을 공유.
// 어느 세션(epoch)을 위해 시작된 refresh인지도 같이 기억해둬야, 그 사이 로그아웃 후 다른
// 계정으로 로그인한 요청이 이전 세션의 refresh 결과를 그대로 기다리는 걸 막을 수 있다
let refreshPromise: Promise<RefreshApiData> | null = null;
let refreshPromiseEpoch: number | null = null;

// role/status까지 포함한 응답 전체를 돌려줌
// (apiFetch의 401 재시도는 accessToken만 쓰지만,
// AuthContext가 세션 복구 시 role/status를 다시 세팅하려면 전체 데이터가 필요)
export async function refreshAccessToken(): Promise<RefreshApiData> {
   const epochAtStart = getSessionEpoch();
   if (!refreshPromise || refreshPromiseEpoch !== epochAtStart) {
      // 이 요청이 응답을 받기 전에 로그아웃했거나 다른 계정으로 로그인했다면(세션이 바뀜)
      // 응답이 오더라도 낡은 것이므로 토큰을 덮어쓰지 않는다
      refreshPromiseEpoch = epochAtStart;
      refreshPromise = rawRequest('/auth/refresh', { method: 'POST' })
         .then(async (res) => {
            if (!res.ok) throw new ApiError(await res.json().catch(() => null), res.status);
            const data = (await res.json()) as RefreshApiData;
            if (getSessionEpoch() === epochAtStart) {
               setAccessToken(data.accessToken);
            }
            return data;
         })
         .finally(() => {
            refreshPromise = null;
            refreshPromiseEpoch = null;
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
      ...(rest.body && !(rest.body instanceof FormData)
         ? { 'Content-Type': 'application/json' }
         : {}),
      ...(!skipAuth && getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
      ...headers,
   });

   let res = await rawRequest(path, { ...rest, headers: buildHeaders() });

   if (res.status === 401 && !skipAuth && !skipRefreshRetry) {
      const epochBeforeRefresh = getSessionEpoch();
      try {
         await refreshAccessToken();
         // 갱신을 기다리는 동안 로그아웃했거나 다른 계정으로 로그인했다면(세션이 바뀜), 이
         // 요청은 원래 이전 세션 몫이었으므로 새 세션의 토큰으로 재시도하면 안 된다 - 그대로 중단
         if (getSessionEpoch() === epochBeforeRefresh) {
            res = await rawRequest(path, { ...rest, headers: buildHeaders() });
         }
      } catch {
         // 갱신이 실패한 시점에 이미 다른 계정으로 로그인돼 있다면(세션이 바뀜) 그 새 세션을
         // 로그아웃시키면 안 되므로, 이 재시도를 시작했던 세션이 아직 그대로일 때만 토큰을 지운다
         if (getSessionEpoch() === epochBeforeRefresh) setAccessToken(null);
      }
   }

   if (res.status === 204) return undefined as T;

   const data = await res.json().catch(() => null);

   if (!res.ok) {
      throw new ApiError(data, res.status);
   }

   return data as T;
}

function extractFilename(contentDisposition: string | null): string | null {
   if (!contentDisposition) return null;
   const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
   if (utf8Match) return decodeURIComponent(utf8Match[1]);
   const plainMatch = /filename="?([^";]+)"?/i.exec(contentDisposition);
   return plainMatch ? plainMatch[1] : null;
}

export interface ApiFetchBlobResult {
   blob: Blob;
   filename: string | null;
}

// 파일 다운로드처럼 응답 본문이 JSON이 아닌 엔드포인트(302 redirect → 바이너리, PDF 등)용.
// fetch가 redirect를 자동으로 따라가 최종 바이너리 응답을 그대로 blob으로 돌려줌
export async function apiFetchBlob(
   path: string,
   options: RequestInit = {},
): Promise<ApiFetchBlobResult> {
   const buildHeaders = (): HeadersInit => ({
      ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
      ...options.headers,
   });

   let res = await rawRequest(path, { ...options, headers: buildHeaders() });

   if (res.status === 401) {
      const epochBeforeRefresh = getSessionEpoch();
      try {
         await refreshAccessToken();
         // apiFetch와 동일한 이유로, 세션이 바뀌었다면 새 세션의 토큰으로 재시도하지 않는다
         if (getSessionEpoch() === epochBeforeRefresh) {
            res = await rawRequest(path, { ...options, headers: buildHeaders() });
         }
      } catch {
         if (getSessionEpoch() === epochBeforeRefresh) setAccessToken(null);
      }
   }

   if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new ApiError(data, res.status);
   }

   const blob = await res.blob();
   const filename = extractFilename(res.headers.get('Content-Disposition'));
   return { blob, filename };
}
