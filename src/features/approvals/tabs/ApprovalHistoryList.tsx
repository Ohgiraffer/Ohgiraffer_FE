'use client';

import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import StatusBadge from '@/features/submissions/components/StatusBadge';
import { useApprovalList } from '../hooks/useApprovalList';
import { APPROVAL_STATUS_LABELS, APPROVAL_STATUS_TONES } from '../types';

// 훈련생(휴가)/강사(구매 예산) 공용 "결재 이력" 탭 - 내가 신청한 결재 목록(REQUESTED)만 조회
export default function ApprovalHistoryList() {
   const router = useRouter();
   const { approvals, isLoading, hasError } = useApprovalList('REQUESTED');

   return (
      <div className="overflow-hidden rounded-sm border border-[#E5E7EB] bg-white">
         <table className="w-full table-fixed text-left text-sm">
            <thead>
               <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
                  <th className="w-[8%] px-8 py-3 text-center font-medium">#</th>
                  <th className="w-[30%] px-15 py-3 font-medium">결재 항목</th>
                  <th className="w-[20%] px-6 py-3 font-medium">담당자</th>
                  <th className="w-[20%] px-6 py-3 font-medium text-center">처리 상태</th>
                  <th className="w-[22%] px-6 py-3 font-medium text-center">신청일자</th>
               </tr>
            </thead>
            <tbody>
               {isLoading ? (
                  <tr>
                     <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                        불러오는 중...
                     </td>
                  </tr>
               ) : hasError ? (
                  <tr>
                     <td colSpan={5} className="px-6 py-16">
                        <div className="flex flex-col items-center gap-3">
                           <p className="text-sm text-gray-400">
                              결재 이력을 불러오는데 실패했습니다.
                           </p>
                           <button
                              type="button"
                              onClick={() => window.location.reload()}
                              className="cursor-pointer rounded-xs border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                           >
                              새로고침
                           </button>
                        </div>
                     </td>
                  </tr>
               ) : approvals.length === 0 ? (
                  <tr>
                     <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                        신청한 결재 내역이 없습니다.
                     </td>
                  </tr>
               ) : (
                  approvals.map((approval, index) => (
                     <tr
                        key={approval.approvalId}
                        onClick={() => router.push(`/approvals/${approval.approvalId}?tab=history`)}
                        className="cursor-pointer border-b border-[#F3F4F6] last:border-b-0 hover:bg-[#F9FAFB]"
                     >
                        <td className="px-8 py-3 text-center text-gray-500">{index + 1}</td>
                        <td className="px-15 py-3 font-medium text-gray-900">{approval.title}</td>
                        <td className="px-6 py-3 text-gray-700">{approval.approverName ?? '—'}</td>
                        <td className="px-6 py-3">
                           <div className="flex items-center justify-center">
                              <StatusBadge tone={APPROVAL_STATUS_TONES[approval.status]}>
                                 {APPROVAL_STATUS_LABELS[approval.status]}
                              </StatusBadge>
                           </div>
                        </td>
                        <td className="px-6 py-3 text-center text-gray-500">
                           {format(new Date(approval.requestedAt), 'yyyy-MM-dd')}
                        </td>
                     </tr>
                  ))
               )}
            </tbody>
         </table>
      </div>
   );
}
