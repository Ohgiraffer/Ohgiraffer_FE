'use client';

import { useEffect, useState } from 'react';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import type {
   GoogleSheetColumnField,
   GoogleSheetSaveResult,
} from '@/components/ui/googlesheet/GoogleSheetSync';
import {
   getBudgetSheetSettings,
   getBudgetSummary,
   saveBudgetSheetSettings,
   syncBudgetSheet,
   type BudgetSummary,
} from '@/services/budget.service';

export type { BudgetSummary } from '@/services/budget.service';

// GoogleSheetSync에 넘기는 컬럼 키가 그대로 백엔드 columnMapping의 키와 일치해야 한다
// (category/totalAmount/usedAmount/remainingAmount) - 구매 예산 신청 폼의 카테고리 드롭다운도
// 이 값을 그대로 쓸 예정
export const BUDGET_SHEET_COLUMNS: GoogleSheetColumnField[] = [
   { key: 'category', label: '카테고리' },
   { key: 'totalAmount', label: '예산안' },
   { key: 'usedAmount', label: '사용금액' },
   { key: 'remainingAmount', label: '잔여 예산' },
];

function notifyUnlessNotConnected(err: unknown, fallback: string) {
   if (err instanceof ApiError && err.status === 400 && err.code === 'COMMON_001') return;
   toast.error(err instanceof ApiError ? err.message : fallback);
}

// GET /budgets/sheets/settings는 연동 전이면 400이 아니라 404(COMMON_006)로 내려온다 - summary
// 쪽의 400/COMMON_001과 코드가 다르므로 별도로 판별한다
function notifyUnlessNotFound(err: unknown, fallback: string) {
   if (err instanceof ApiError && err.status === 404 && err.code === 'COMMON_006') return;
   toast.error(err instanceof ApiError ? err.message : fallback);
}

// 매니저의 "예산 관리" 탭 상태. 페이지 진입/새로고침 시마다 먼저 시트를 다시 동기화(POST
// /budgets/sync)한 뒤 GET /budgets/summary로 최신값을 읽어온다 - summary 조회 자체는 재동기화를
// 하지 않으므로 sync를 안 부르면 시트를 고쳐도 화면이 갱신되지 않는다.
// 저장된 시트 설정이 없으면(400/COMMON_001) 아직 연동 전인 정상 상태로 보고 연동 폼만 보여준다.
// 저장된 연동 설정 자체(GET /budgets/sheets/settings)도 별도로 조회해서, 이미 연동을 마친 뒤
// 새로고침해도 GoogleSheetSync가 "연결됨" 상태로 다시 그려지도록 한다(그동안 이 조회가 없어서
// 저장은 됐는데 화면엔 매번 연동 폼부터 다시 보이는 문제가 있었음)
export function useBudgetManagement() {
   const [summary, setSummary] = useState<BudgetSummary | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [isConnected, setIsConnected] = useState(false);
   const [spreadsheetUrl, setSpreadsheetUrl] = useState('');

   useEffect(() => {
      let isMounted = true;

      async function loadSettings() {
         try {
            const settings = await getBudgetSheetSettings();
            if (isMounted) {
               setIsConnected(true);
               setSpreadsheetUrl(settings.spreadsheetUrl);
            }
         } catch (err) {
            if (!isMounted) return;
            notifyUnlessNotFound(err, '예산 시트 연동 설정을 불러오지 못했습니다.');
         }
      }

      async function loadSummary() {
         try {
            await syncBudgetSheet();
         } catch (err) {
            if (!isMounted) return;
            // sync 실패는(연동 전 제외) 알리되, summary는 마지막으로 동기화된 값이라도 계속 시도해서 보여준다
            notifyUnlessNotConnected(
               err,
               '예산 시트 동기화에 실패했습니다. 최신 데이터가 아닐 수 있습니다.',
            );
         }

         try {
            const data = await getBudgetSummary();
            if (isMounted) setSummary(data);
         } catch (err) {
            if (!isMounted) return;
            notifyUnlessNotConnected(
               err,
               '예산 현황을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
            );
         } finally {
            if (isMounted) setIsLoading(false);
         }
      }

      // 서로 독립적인 조회라 병렬로 실행한다(하나가 느려도 다른 하나를 막지 않음)
      loadSettings();
      loadSummary();

      return () => {
         isMounted = false;
      };
   }, []);

   // 설정 저장(최초 동기화) 후 실제 집계된 요약값을 다시 조회해서 화면에 반영한다.
   // 이 함수가 끝날 때까지 GoogleSheetSync의 "저장 중..." 상태가 유지되므로, 대시보드가 비어있는
   // 채로 "연결됨" 카드로 먼저 바뀌는 어색한 순간이 생기지 않는다
   const handleSaveMapping = async (result: GoogleSheetSaveResult) => {
      await saveBudgetSheetSettings({
         spreadsheetUrl: result.spreadsheetUrl,
         sheetName: result.sheetName,
         columnMapping: {
            category: result.columnMapping.category.columnName,
            totalAmount: result.columnMapping.totalAmount.columnName,
            usedAmount: result.columnMapping.usedAmount.columnName,
            remainingAmount: result.columnMapping.remainingAmount.columnName,
         },
      });
      const freshSummary = await getBudgetSummary();
      setSummary(freshSummary);
      setIsConnected(true);
      setSpreadsheetUrl(result.spreadsheetUrl);
   };

   return { summary, isLoading, isConnected, spreadsheetUrl, handleSaveMapping };
}
