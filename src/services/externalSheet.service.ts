import { apiFetch } from '@/lib/http';

// 예산/평가/출결 등 여러 기능이 공통으로 쓰는 외부 시트 연결 확인 API.
// 도메인별 필수 컬럼 검증은 각 기능의 설정 저장 API에서 처리한다.
export interface ExternalSheetInfo {
   sheetName: string;
   columns: string[];
}

export interface ExternalSheetValidateResult {
   spreadsheetId: string;
   spreadsheetTitle: string;
   sheets: ExternalSheetInfo[];
}

export function validateExternalSheet(spreadsheetUrl: string) {
   return apiFetch<ExternalSheetValidateResult>('/external-sheets/validate', {
      method: 'POST',
      body: JSON.stringify({ spreadsheetUrl }),
   });
}
