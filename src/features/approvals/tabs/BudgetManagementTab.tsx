'use client';

import GoogleSheetSync from '@/components/ui/googlesheet/GoogleSheetSync';
import BudgetDashboardSummary from '../components/BudgetDashboardSummary';
import { BUDGET_SHEET_COLUMNS, useBudgetManagement } from '../hooks/useBudgetManagement';

// 매니저 "예산 관리" 탭 - 구글 시트 연동 전에는 연동 폼만 보이고(사진1), 연동(설정 저장) 후에는
// 연동 폼 위에 대시보드가 함께 노출된다(사진2). 저장이 끝난 GoogleSheetSync는 스스로 "연결됨"
// 카드로 바뀐다(사진3) - 강사는 이 탭에서 연동 폼 없이 대시보드만 보게 될 예정(추후 구현)
export default function BudgetManagementTab() {
   const { summary, isLoading, handleSaveMapping } = useBudgetManagement();

   if (isLoading) {
      return <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>;
   }

   return (
      <div className="flex flex-col gap-6">
         {summary && <BudgetDashboardSummary summary={summary} />}
         <GoogleSheetSync columns={BUDGET_SHEET_COLUMNS} onSave={handleSaveMapping} />
      </div>
   );
}
