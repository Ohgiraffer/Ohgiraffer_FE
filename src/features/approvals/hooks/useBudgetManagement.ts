'use client';

import { useEffect, useState } from 'react';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import type {
   GoogleSheetColumnField,
   GoogleSheetSaveResult,
} from '@/components/ui/googlesheet/GoogleSheetSync';
import {
   getBudgetSummary,
   saveBudgetSheetSettings,
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

// 매니저의 "예산 관리" 탭 상태. 페이지 진입/새로고침 시 GET /budgets/summary로 연동 여부까지 함께
// 확인한다 - 저장된 시트 설정이 없으면(400/COMMON_001) 아직 연동 전인 정상 상태로 보고 연동 폼만 보여준다
export function useBudgetManagement() {
   const [summary, setSummary] = useState<BudgetSummary | null>(null);
   const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
      let isMounted = true;

      getBudgetSummary()
         .then((data) => {
            if (isMounted) setSummary(data);
         })
         .catch((err) => {
            if (!isMounted) return;
            // 연동 전 상태(400/COMMON_001)는 정상 케이스라 에러 안내 없이 연동 폼만 보여준다.
            // 그 외(구글 시트 접근 오류 등)는 알려주되, 연동 폼에서 재연동을 시도할 수 있게 둔다
            if (!(err instanceof ApiError && err.code === 'COMMON_001')) {
               toast.error(
                  err instanceof ApiError
                     ? err.message
                     : '예산 현황을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
               );
            }
         })
         .finally(() => {
            if (isMounted) setIsLoading(false);
         });

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
   };

   return { summary, isLoading, handleSaveMapping };
}
