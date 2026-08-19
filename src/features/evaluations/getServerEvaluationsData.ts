import { API_BASE_URL, ApiError } from '@/lib/http';
import { serverApiFetch } from '@/lib/auth/serverPrefetch';
import type { EvaluationSheetLink, EvaluationSyncLogSummary } from '@/services/evaluation.service';

// evaluation.service.ts의 getEvaluationSheetLink()와 동일한 엔드포인트지만, 연동 전이면
// 백엔드가 204(No Content)를 내려주는 걸 serverApiFetch가 처리 못 해서(항상 res.json()을
// 시도함) 따로 둔다 - 204는 res.ok라 에러가 아니라 "아직 연동 안 함"이라는 정상 상태다
async function getServerEvaluationSheetLink(
   accessToken: string,
): Promise<EvaluationSheetLink | null> {
   const res = await fetch(`${API_BASE_URL}/evaluations/sheet-link`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
   });
   if (res.status === 204) return null;
   if (!res.ok) {
      throw new ApiError(await res.json().catch(() => null), res.status);
   }
   return res.json();
}

export interface ServerEvaluationsData {
   // null이면 아직 시트 연동을 안 한 정상 상태(연동 자체를 실패한 게 아님)
   initialSheetLink: EvaluationSheetLink | null;
   initialSyncLogs: EvaluationSyncLogSummary[];
}

// EvaluationsPageClient가 탭(연동 설정/이력)과 무관하게 두 훅을 항상 같이 쓰므로 둘 다 프리페치한다
export async function getServerEvaluationsData(
   accessToken: string,
): Promise<ServerEvaluationsData> {
   const [initialSheetLink, initialSyncLogs] = await Promise.all([
      getServerEvaluationSheetLink(accessToken),
      serverApiFetch<EvaluationSyncLogSummary[]>('/evaluations/sync-logs', accessToken),
   ]);
   return { initialSheetLink, initialSyncLogs };
}
