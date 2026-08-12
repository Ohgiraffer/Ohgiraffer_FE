import type { TraineeApprovalHistoryEntry } from '../../types';

export default function ApprovalDetailTab({ approvals }: { approvals: TraineeApprovalHistoryEntry[] }) {
   return (
      <div className="overflow-hidden rounded-sm border border-[#E5E7EB] bg-white">
         <table className="w-full table-fixed text-left text-sm">
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
                  approvals.map((approval, index) => (
                     <tr key={index} className="border-b border-[#F3F4F6] last:border-b-0">
                        <td className="px-6 py-4 text-gray-700">{approval.requestedAt}</td>
                        <td className="px-6 py-4 text-gray-900">{approval.type}</td>
                        <td className="px-6 py-4 text-gray-700">{approval.period}</td>
                        <td className="px-6 py-4 text-gray-700">{approval.approvedAt ?? '—'}</td>
                     </tr>
                  ))
               )}
            </tbody>
         </table>
      </div>
   );
}
