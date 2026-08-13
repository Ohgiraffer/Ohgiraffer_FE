import { apiFetch } from '@/lib/http';

export interface EvaluationSheetColumnMapping {
   traineeIdentifier: string;
   evaluationType: string;
   item: string;
   score: string;
   // 의견 컬럼은 매핑하지 않아도 저장 가능 - 생략했으면 null로 내려온다
   comment: string | null;
}

export interface EvaluationSheetLink {
   sheetLinkId: number;
   spreadsheetUrl: string;
   tabName: string;
   columnMapping: EvaluationSheetColumnMapping;
   // 설정을 고쳐도 그대로 유지됨(수정 자체가 동기화를 의미하지 않음) - 아직 한 번도 동기화 안 했으면 null
   lastSyncedAt: string | null;
}

// 운영진(강사·매니저) 전용 - 평가 관리 "연동 설정" 탭에 들어올 때 한 번 조회.
// 구글 시트를 호출하지 않고 저장된 값만 돌려주므로 호출 한도와 무관하게 몇 번이든 불러도 된다.
// 아직 연동한 적 없으면 204(apiFetch가 undefined로 처리) - 오류가 아니라 "신규 등록" 정상 상태
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

// 운영진 전용 - 평가 시트 연동 설정 저장(최초 연동/수정 공용).
// 응답이 저장 결과를 그대로 돌려주므로 저장 성공 후 화면을 다시 그릴 때 별도로 재조회할 필요는 없다
export function saveEvaluationSheetLink(body: SaveEvaluationSheetLinkRequest) {
   return apiFetch<EvaluationSheetLink>('/evaluations/sheet-link', {
      method: 'POST',
      body: JSON.stringify(body),
   });
}

export interface EvaluationSyncSkippedRow {
   // 시트에서 보이는 줄 번호 - 헤더가 1행
   rowNumber: number;
   reason: string;
}

export interface EvaluationSyncResult {
   // 바뀐 내용이 없으면 이력 자체를 만들지 않아 null로 내려온다(오류 아님)
   syncLogId: number | null;
   addedCount: number;
   updatedCount: number;
   // addedCount + updatedCount. 화면의 "건수"로 그대로 쓴다
   changedCount: number;
   // AI(제미나이)가 변경 내역을 문장으로 정리한 결과 - 실패하면 자동으로 목록 형태로 대체되어 오므로
   // 형태를 가정하지 않고 줄바꿈만 살려서 그대로 보여주면 된다
   diffSummary: string;
   skipped: EvaluationSyncSkippedRow[];
}

// 운영진 전용 - 저장된 연동 설정으로 시트를 읽어 평가 데이터를 최신화(요청 바디 없음).
// 내부적으로 구글 시트 1회 + 제미나이 1회를 호출해 수 초가 걸릴 수 있으므로, 호출 중에는 버튼을
// 반드시 비활성화해야 한다(연타 시 같은 동기화가 겹쳐 돌고 팀 공용 시트 호출 한도도 그만큼 소모됨)
export function runEvaluationSheetSync() {
   return apiFetch<EvaluationSyncResult>('/evaluations/sync', {
      method: 'POST',
   });
}

export interface EvaluationSyncLogSummary {
   syncLogId: number;
   executedByName: string | null;
   // 그때 추가+수정된 건수 - 실행 당시의 addedCount/updatedCount 세부 breakdown은 목록에 없음
   changedCount: number;
   diffSummary: string;
   syncedAt: string;
}

// 운영진 전용 - 평가 관리 "이력" 탭에 들어올 때 한 번 조회. 파라미터 없이 최신순 전체를 배열로
// 내려준다. 연동만 하고 한 번도 동기화 안 했으면(또는 변경이 없어서 이력이 안 쌓였으면) 빈 배열 -
// 오류가 아니라 "아직 이력이 없음" 정상 상태
export function getEvaluationSyncLogs() {
   return apiFetch<EvaluationSyncLogSummary[]>('/evaluations/sync-logs');
}

// 운영진 전용 - 이력 목록에서 항목을 선택했을 때 상세 조회. 목록 항목과 응답 형식이 완전히 같아서
// 같은 EvaluationSyncLogSummary 타입을 그대로 쓴다. 구글 시트는 호출하지 않음.
// 없는 syncLogId면 404(EVALUATION_004) - 목록으로 돌려보내면 된다
export function getEvaluationSyncLogDetail(syncLogId: number) {
   return apiFetch<EvaluationSyncLogSummary>(`/evaluations/sync-logs/${syncLogId}`);
}
