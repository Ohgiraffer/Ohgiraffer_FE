import { apiFetch } from '@/lib/http';

export interface BudgetSheetColumnMapping {
   category: string;
   totalAmount: string;
   usedAmount: string;
   remainingAmount: string;
}

export interface SaveBudgetSheetSettingsRequest {
   spreadsheetUrl: string;
   sheetName: string;
   columnMapping: BudgetSheetColumnMapping;
}

export interface SaveBudgetSheetSettingsResponse {
   syncedCount: number;
   syncedAt: string;
}

// 예산 시트 설정을 최초 저장하면서 즉시 동기화한다
export function saveBudgetSheetSettings(body: SaveBudgetSheetSettingsRequest) {
   return apiFetch<SaveBudgetSheetSettingsResponse>('/budgets/sheets/settings', {
      method: 'POST',
      body: JSON.stringify(body),
   });
}

export interface SyncBudgetSheetResponse {
   syncedCount: number;
   syncedAt: string;
}

// 저장된 시트 설정 기준으로 예산 데이터를 다시 동기화한다(요청 본문 없음). GET /budgets/summary는
// 재동기화를 하지 않고 저장된 값만 돌려주므로, 최신 시트 내용을 반영하려면 화면 진입/새로고침 시
// 이 API를 먼저 호출해야 한다. 저장된 시트 설정이 없으면 400(COMMON_001)
export function syncBudgetSheet() {
   return apiFetch<SyncBudgetSheetResponse>('/budgets/sync', {
      method: 'POST',
   });
}

export interface BudgetCategorySummary {
   categoryId: number;
   categoryName: string;
   totalAmount: number;
   usedAmount: number;
   remainingAmount: number;
   usageRate: number;
}

export interface BudgetSummary {
   totalBudgetAmount: number;
   usedAmount: number;
   remainingAmount: number;
   usageRate: number;
   lastSyncedAt: string;
   categories: BudgetCategorySummary[];
}

// 예산 요약 조회 - 재동기화 없이 저장된(마지막으로 동기화된) 값만 그대로 돌려준다.
// 최신 시트 내용을 반영하려면 호출 전에 syncBudgetSheet()를 먼저 호출해야 한다.
// 저장된 시트 설정이 아직 없으면 400(COMMON_001) - "연동 전" 상태로 취급한다
export function getBudgetSummary() {
   return apiFetch<BudgetSummary>('/budgets/summary');
}
