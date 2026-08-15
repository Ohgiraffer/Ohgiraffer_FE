'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
   type BudgetSheetColumnMapping,
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
   // 여기서 새로 받아온 값은 usePurchaseBudgetRequestForm이 쓰는 ['budgetSummary'] 캐시에도
   // 그대로 채워 넣는다 - 이 훅은 시트 동기화 직후라 항상 최신 값을 직접 조회해야 해서
   // useQuery로 읽지 않고, 대신 결과를 캐시에 밀어 넣어 다른 화면이 최신 값을 바로 보게 한다
   const queryClient = useQueryClient();
   const [summary, setSummary] = useState<BudgetSummary | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [isConnected, setIsConnected] = useState(false);
   const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
   const [columnMapping, setColumnMapping] = useState<BudgetSheetColumnMapping | null>(null);

   useEffect(() => {
      let isMounted = true;

      async function loadSettings() {
         try {
            const settings = await getBudgetSheetSettings();
            if (isMounted) {
               setIsConnected(true);
               setSpreadsheetUrl(settings.spreadsheetUrl);
               setColumnMapping(settings.columnMapping);
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
            queryClient.setQueryData(['budgetSummary'], data);
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
   }, [queryClient]);

   const handleSaveMapping = async (result: GoogleSheetSaveResult) => {
      const mapping: BudgetSheetColumnMapping = {
         category: result.columnMapping.category.columnName,
         totalAmount: result.columnMapping.totalAmount.columnName,
         usedAmount: result.columnMapping.usedAmount.columnName,
         remainingAmount: result.columnMapping.remainingAmount.columnName,
      };

      await saveBudgetSheetSettings({
         spreadsheetUrl: result.spreadsheetUrl,
         sheetName: result.sheetName,
         columnMapping: mapping,
      });
      setIsConnected(true);
      setSpreadsheetUrl(result.spreadsheetUrl);
      setColumnMapping(mapping);

      try {
         const freshSummary = await getBudgetSummary();
         setSummary(freshSummary);
         queryClient.setQueryData(['budgetSummary'], freshSummary);
      } catch (err) {
         notifyUnlessNotConnected(
            err,
            '설정은 저장됐지만 최신 예산 현황을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
         );
      }
   };

   return { summary, isLoading, isConnected, spreadsheetUrl, columnMapping, handleSaveMapping };
}
