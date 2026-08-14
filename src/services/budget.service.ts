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

// 예산 시트 설정을 최초 저장하면서 즉시 동기화
export function saveBudgetSheetSettings(body: SaveBudgetSheetSettingsRequest) {
   return apiFetch<SaveBudgetSheetSettingsResponse>('/budgets/sheets/settings', {
      method: 'POST',
      body: JSON.stringify(body),
   });
}

export interface BudgetSheetSettings {
   spreadsheetUrl: string;
   sheetName: string;
   columnMapping: BudgetSheetColumnMapping;
   lastSyncedAt: string | null;
}

// 저장된 예산 시트 설정 조회
export function getBudgetSheetSettings() {
   return apiFetch<BudgetSheetSettings>('/budgets/sheets/settings');
}

export interface SyncBudgetSheetResponse {
   syncedCount: number;
   syncedAt: string;
}

// 저장된 시트 설정 기준으로 예산 데이터를 다시 동기화
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

// 예산 요약 조회 - 재동기화 없이 저장된(마지막으로 동기화된) 값
export function getBudgetSummary() {
   return apiFetch<BudgetSummary>('/budgets/summary');
}
