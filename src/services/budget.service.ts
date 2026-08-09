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

// 예산 시트 설정을 최초 저장하면서 즉시 동기화한다 - 이후에는 GET /budgets/summary를 호출할 때마다
// 다시 동기화되므로 별도의 "재동기화" API는 없다
export function saveBudgetSheetSettings(body: SaveBudgetSheetSettingsRequest) {
   return apiFetch<SaveBudgetSheetSettingsResponse>('/budgets/sheets/settings', {
      method: 'POST',
      body: JSON.stringify(body),
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

// 예산 요약 조회 - 호출할 때마다 연동된 구글 시트를 다시 동기화한 뒤 최신값을 돌려준다.
// 저장된 시트 설정이 아직 없으면 400(COMMON_001) - "연동 전" 상태로 취급한다
export function getBudgetSummary() {
   return apiFetch<BudgetSummary>('/budgets/summary');
}
