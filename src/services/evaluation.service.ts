import { apiFetch } from '@/lib/http';

export interface EvaluationSheetColumnMapping {
   traineeIdentifier: string;
   evaluationType: string;
   item: string;
   score: string;
   comment: string | null;
}

export interface EvaluationSheetLink {
   sheetLinkId: number;
   spreadsheetUrl: string;
   tabName: string;
   columnMapping: EvaluationSheetColumnMapping;
   lastSyncedAt: string | null;
}

// 운영진(강사·매니저) 전용 - 평가 관리 "연동 설정" 탭에 들어올 때 조회
export function getEvaluationSheetLink() {
   return apiFetch<EvaluationSheetLink>('/evaluations/sheet-link');
}

export interface SaveEvaluationSheetLinkRequest {
   spreadsheetUrl: string;
   // 생략하면 첫 번째 탭으로 저장됨
   tabName?: string;
   columnMapping: {
      traineeIdentifier: string;
      evaluationType: string;
      item: string;
      score: string;
      comment?: string | null;
   };
}

// 운영진 전용 - 평가 시트 연동 설정 저장(최초 연동/수정 공용)
export function saveEvaluationSheetLink(body: SaveEvaluationSheetLinkRequest) {
   return apiFetch<EvaluationSheetLink>('/evaluations/sheet-link', {
      method: 'POST',
      body: JSON.stringify(body),
   });
}

export interface EvaluationSyncSkippedRow {
   rowNumber: number;
   reason: string;
}

// 훈련생당 카드 하나 - 한 사람이 여러 항목에서 바뀌어도 하나로 묶여서 내려온다.
// item/score/comment는 여러 항목이면 "항목명 값 / 항목명 값" 형태로 서버가 이미 이어붙인 문자열이다.
export interface EvaluationSyncSummaryCard {
   traineeName: string;
   evaluationType: string;
   item: string;
   score: string;
   comment: string;
   // AI가 만드는 값 - 제미나이 호출이 실패하면 전체가 null로 내려오지만 오류는 아니다(평가 반영 자체는 이미 끝난 상태)
   needsCheck: string | null;
}

export interface EvaluationSyncResult {
   syncLogId: number | null;
   addedCount: number;
   updatedCount: number;
   changedCount: number;
   summaries: EvaluationSyncSummaryCard[];
   skipped: EvaluationSyncSkippedRow[];
}

// 운영진 전용 - 저장된 연동 설정으로 시트를 읽어 평가 데이터를 최신화
export function runEvaluationSheetSync() {
   return apiFetch<EvaluationSyncResult>('/evaluations/sync', {
      method: 'POST',
   });
}

export interface EvaluationSyncLogSummary {
   syncLogId: number;
   executedByName: string | null;
   changedCount: number;
   summaries: EvaluationSyncSummaryCard[];
   syncedAt: string;
}

// 운영진 전용 - 평가 관리 "이력" 탭
export function getEvaluationSyncLogs() {
   return apiFetch<EvaluationSyncLogSummary[]>('/evaluations/sync-logs');
}

// 운영진 전용 - 이력 목록에서 항목을 선택했을 때 상세 조회
export function getEvaluationSyncLogDetail(syncLogId: number) {
   return apiFetch<EvaluationSyncLogSummary>(`/evaluations/sync-logs/${syncLogId}`);
}

export interface NotifyEvaluationSyncResultResponse {
   // 알림을 보낸 사람 수(호출한 본인 제외) - 0이어도 오류가 아니라 "보낼 다른 운영진이 없음"을 뜻함
   notifiedCount: number;
}

// 운영진 전용 - 방금 실행한 동기화의 변경 내용을 재원 중인 다른 강사·매니저에게 알림으로 발송
// (자동으로 나가지 않고, "수정 완료 알림 보내기" 버튼을 눌렀을 때만 호출됨)
export function notifyEvaluationSyncResult(syncLogId: number) {
   return apiFetch<NotifyEvaluationSyncResultResponse>(
      `/evaluations/sync-logs/${syncLogId}/notify`,
      { method: 'POST' },
   );
}
