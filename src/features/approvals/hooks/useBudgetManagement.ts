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

function notifyUnlessNotFound(err: unknown, fallback: string) {
   if (err instanceof ApiError && err.status === 404 && err.code === 'COMMON_006') return;
   toast.error(err instanceof ApiError ? err.message : fallback);
}

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
         }
      }

      Promise.allSettled([loadSettings(), loadSummary()]).then(() => {
         if (isMounted) setIsLoading(false);
      });

      return () => {
         isMounted = false;
      };
   }, []);

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
      setIsConnected(true);
      setSpreadsheetUrl(result.spreadsheetUrl);

      try {
         const freshSummary = await getBudgetSummary();
         setSummary(freshSummary);
      } catch (err) {
         notifyUnlessNotConnected(
            err,
            '설정은 저장됐지만 최신 예산 현황을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
         );
      }
   };

   return { summary, isLoading, isConnected, spreadsheetUrl, handleSaveMapping };
}
