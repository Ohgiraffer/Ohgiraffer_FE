'use client';

import GoogleSheetSync from '@/components/ui/googlesheet/GoogleSheetSync';
import BudgetDashboardSummary from '../components/BudgetDashboardSummary';
import { BUDGET_SHEET_COLUMNS, useBudgetManagement } from '../hooks/useBudgetManagement';

export default function BudgetManagementTab() {
   const { summary, isLoading, isConnected, spreadsheetUrl, columnMapping, handleSaveMapping } =
      useBudgetManagement();

   if (isLoading) {
      return <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>;
   }

   return (
      <div className="flex flex-col gap-6">
         {summary && <BudgetDashboardSummary summary={summary} />}
         <GoogleSheetSync
            columns={BUDGET_SHEET_COLUMNS}
            onSave={handleSaveMapping}
            initialConnection={
               isConnected && columnMapping
                  ? { spreadsheetUrl, columnMapping: columnMapping as unknown as Record<string, string> }
                  : undefined
            }
         />
      </div>
   );
}
