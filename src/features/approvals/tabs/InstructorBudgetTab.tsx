'use client';

import BudgetDashboardSummary from '../components/BudgetDashboardSummary';
import { useBudgetManagement } from '../hooks/useBudgetManagement';

// 강사 "예산 관리" 탭 - 매니저와 달리 구글 시트 연동 폼 없이 대시보드만 읽기 전용으로 보여준다.
// 매니저가 연동을 완료해두면 GET /budgets/summary가 그대로 조회돼서 여기도 같은 대시보드가 뜬다
export default function InstructorBudgetTab() {
   const { summary, isLoading } = useBudgetManagement();

   if (isLoading) {
      return <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>;
   }

   if (!summary) {
      return (
         <p className="py-16 text-center text-sm text-gray-400">
            아직 예산이 연동되지 않았습니다. 매니저에게 문의해주세요.
         </p>
      );
   }

   return <BudgetDashboardSummary summary={summary} />;
}
