'use client';

import BudgetDashboardSummary from '../components/BudgetDashboardSummary';
import { useBudgetManagement } from '../hooks/useBudgetManagement';

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
