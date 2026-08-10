// GoogleSheetSync에 넘기는 컬럼 키 - 백엔드 연동 시 columnMapping의 키와 그대로 일치해야 함
export type EvaluationSheetColumnKey =
   'traineeIdentifier' | 'evaluationType' | 'evaluationItem' | 'score' | 'comment';

// AI가 요약한 훈련생 1명의 변경 사항
export type AiSyncSummaryItem = {
   traineeId: string;
   traineeName: string;
   // 점수 컬럼이 비어있는 등 변화량을 계산할 수 없으면 null
   scoreChange: number | null;
   comment: string;
   // "확인 필요" 배지에 넣을 안내 문구 - null이면 배지를 표시하지 않음
   needsCheckNote: string | null;
};

// 동기화 1회 실행 이력
export type SyncHistoryEntry = {
   id: string;
   syncedAt: string; // ISO
   executedByName: string;
   changeCount: number;
   summary: AiSyncSummaryItem[];
};
