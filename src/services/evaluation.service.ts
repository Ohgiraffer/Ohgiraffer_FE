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

export interface EvaluationSyncResult {
   syncLogId: number | null;
   addedCount: number;
   updatedCount: number;
   changedCount: number;
   diffSummary: string;
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
   diffSummary: string;
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
