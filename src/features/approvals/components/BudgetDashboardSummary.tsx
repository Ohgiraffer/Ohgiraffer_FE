'use client';

import { format } from 'date-fns';
import type { BudgetSummary } from '@/services/budget.service';

function formatCurrency(amount: number) {
   return `₩${amount.toLocaleString('ko-KR')}`;
}

function StatCard({ label, value, caption }: { label: string; value: string; caption: string }) {
   return (
      <div className="flex-1 p-6">
         <p className="text-sm text-gray-400">{label}</p>
         <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
         <p className="mt-1 text-xs text-gray-400">{caption}</p>
      </div>
   );
}

// 매니저(추후 강사)의 예산 관리 대시보드 - 전체 예산/사용 금액/잔여 예산 요약 + 카테고리별 현황.
// 구글 시트 연동이 끝난 뒤에만 보여주므로, summary는 항상 값이 있다는 전제로 렌더링한다
export default function BudgetDashboardSummary({ summary }: { summary: BudgetSummary }) {
   const usedPercent = Math.round(summary.usageRate);
   const remainingPercent = 100 - usedPercent;

   return (
      <div className="flex flex-col gap-6">
         <div className="flex divide-x divide-[#E5E7EB] overflow-hidden rounded-sm border border-[#E5E7EB] bg-white">
            <StatCard
               label="전체 예산"
               value={formatCurrency(summary.totalBudgetAmount)}
               caption="과정 전체"
            />
            <StatCard
               label="사용 금액"
               value={formatCurrency(summary.usedAmount)}
               caption={`${usedPercent}% 사용`}
            />
            <StatCard
               label="잔여 예산"
               value={formatCurrency(summary.remainingAmount)}
               caption={`${remainingPercent}% 잔여`}
            />
         </div>

         <div className="overflow-hidden rounded-sm border border-[#E5E7EB] bg-white">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
               <h3 className="text-sm font-bold text-gray-900">카테고리별 예산 현황</h3>
               <span className="text-xs text-gray-400">
                  마지막 동기화 {format(new Date(summary.lastSyncedAt), 'yyyy-MM-dd HH:mm')}
               </span>
            </div>
            <table className="w-full table-fixed text-left text-sm">
               <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
                     <th className="w-[25%] px-6 py-3 font-medium">카테고리</th>
                     <th className="w-[25%] px-6 py-3 text-right font-medium">예산안</th>
                     <th className="w-[25%] px-6 py-3 text-right font-medium">사용 금액</th>
                     <th className="w-[25%] px-6 py-3 text-right font-medium">잔여</th>
                  </tr>
               </thead>
               <tbody>
                  {summary.categories.map((row) => (
                     <tr key={row.categoryId} className="border-b border-[#F3F4F6] last:border-b-0">
                        <td className="px-6 py-4 font-medium text-gray-900">{row.categoryName}</td>
                        <td className="px-6 py-4 text-right text-gray-700">
                           {formatCurrency(row.totalAmount)}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-700">
                           {formatCurrency(row.usedAmount)}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">
                           {formatCurrency(row.remainingAmount)}
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
   );
}
