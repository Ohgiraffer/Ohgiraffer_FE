'use client';

import { useTraineeApprovals } from '../../hooks/useTraineeApprovals';

export default function ApprovalDetailTab({ traineeId }: { traineeId: number }) {
   const { approvals, isLoading, error, retry } = useTraineeApprovals(traineeId);

   if (isLoading) {
      return <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>;
   }

   if (error) {
      return (
         <div className="flex flex-col items-center gap-3 py-16">
            <p className="text-sm text-gray-400">결재 이력을 불러오지 못했습니다.</p>
            <button
               type="button"
               onClick={retry}
               className="cursor-pointer rounded-xs border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
               다시 시도
            </button>
         </div>
      );
   }

   return (
      <div className="overflow-hidden rounded-sm border border-[#E5E7EB] bg-white">
         <table className="w-full table-fixed text-center text-sm">
            <thead>
               <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
                  <th className="w-[20%] px-6 py-3 font-medium">신청일</th>
                  <th className="w-[20%] px-6 py-3 font-medium">유형</th>
                  <th className="w-[40%] px-6 py-3 font-medium">기간</th>
                  <th className="w-[20%] px-6 py-3 font-medium">승인일</th>
               </tr>
            </thead>
            <tbody>
               {approvals.length === 0 ? (
                  <tr>
                     <td colSpan={4} className="px-6 py-10 text-center text-gray-400">
                        결재 이력이 없습니다.
                     </td>
                  </tr>
               ) : (
                  approvals.map((approval) => (
                     <tr key={approval.approvalId} className="border-b border-[#F3F4F6] last:border-b-0">
                        <td className="px-6 py-4 text-gray-700">{approval.requestedDate}</td>
                        <td className="px-6 py-4 text-gray-900">{approval.typeName}</td>
                        <td className="px-6 py-4 text-gray-700">{approval.period}</td>
                        <td className="px-6 py-4 text-gray-700">{approval.approvedDate ?? '—'}</td>
                     </tr>
                  ))
               )}
            </tbody>
         </table>
      </div>
   );
}
