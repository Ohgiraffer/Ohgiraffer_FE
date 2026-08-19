'use client';

import InlineProgressBar from '@/components/ui/loading/InlineProgressBar';
import BudgetDashboardSummary from '../components/BudgetDashboardSummary';
import { useBudgetManagement } from '../hooks/useBudgetManagement';

export default function InstructorBudgetTab() {
   const { summary, isLoading } = useBudgetManagement();

   if (isLoading) {
      return (
         <div className="flex flex-col items-center justify-center gap-2 py-16">
            <InlineProgressBar />
            <p className="text-sm text-gray-400">불러오는 중...</p>
         </div>
      );
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
