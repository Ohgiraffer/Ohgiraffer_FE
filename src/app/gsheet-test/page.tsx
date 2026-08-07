'use client';

import GoogleSheetSync from '@/components/ui/GoogleSheetSync';

export default function GSheetTestPage() {
   return (
      <div className="p-8">
         <GoogleSheetSync
            columns={[
               { key: 'category', label: '카테고리' },
               { key: 'budgetPlan', label: '예산안' },
               { key: 'usedAmount', label: '사용금액' },
            ]}
            onSave={async (result) => {
               await new Promise((r) => setTimeout(r, 500));
               console.log('saved', result);
            }}
         />
      </div>
   );
}
