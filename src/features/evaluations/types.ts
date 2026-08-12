import type { EvaluationSyncSkippedRow } from '@/services/evaluation.service';

// 동기화 이력 1건 - 목록·상세 API(GET /evaluations/sync-logs, GET /evaluations/sync-logs/{id})는
// changedCount/diffSummary까지만 내려주고 addedCount/updatedCount/skipped는 없다. 방금 이 화면에서
// 직접 실행한 동기화(POST /evaluations/sync) 결과에만 그 세부 항목이 있어 있으면 채우고, 목록·상세로
// 조회한 과거 이력은 비워둔 채로 AiSyncSummaryCard가 해당 섹션을 숨긴다.
// syncLogId는 상세 페이지로 이동할 때 쓰는 식별자 - 변경이 없어 이력이 안 만들어진 방금 실행 결과만 null
export type SyncHistoryEntry = {
   id: string;
   syncLogId: number | null;
   syncedAt: string; // ISO
   executedByName: string;
   changedCount: number;
   diffSummary: string;
   addedCount?: number;
   updatedCount?: number;
   skipped?: EvaluationSyncSkippedRow[];
};
