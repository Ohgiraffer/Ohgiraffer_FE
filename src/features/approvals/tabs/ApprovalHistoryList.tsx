'use client';

import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import StatusBadge from '@/features/submissions/components/StatusBadge';
import { useApprovalList } from '../hooks/useApprovalList';
import { APPROVAL_STATUS_LABELS, APPROVAL_STATUS_TONES } from '../types';

// 훈련생(휴가)/강사(구매 예산) 공용 "결재 이력" 탭 - 내가 신청한 결재 목록(REQUESTED)만 조회
export default function ApprovalHistoryList() {
   const router = useRouter();
   const { approvals, isLoading } = useApprovalList('REQUESTED');

   return (
      <div className="overflow-hidden rounded-sm border border-[#E5E7EB] bg-white">
         <table className="w-full table-fixed text-left text-sm">
            <thead>
               <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
                  <th className="w-[10%] px-6 py-3 font-medium">#</th>
                  <th className="w-[50%] px-6 py-3 font-medium">결재 항목</th>
                  <th className="w-[20%] px-6 py-3 font-medium text-center">처리 상태</th>
                  <th className="w-[20%] px-6 py-3 font-medium text-center">신청일자</th>
               </tr>
            </thead>
            <tbody>
               {isLoading ? (
                  <tr>
                     <td colSpan={4} className="px-6 py-10 text-center text-gray-400">
                        불러오는 중...
                     </td>
                  </tr>
               ) : approvals.length === 0 ? (
                  <tr>
                     <td colSpan={4} className="px-6 py-10 text-center text-gray-400">
                        신청한 결재 내역이 없습니다.
                     </td>
                  </tr>
               ) : (
                  approvals.map((approval, index) => {
                     // 결재 이력 상세는 아직 휴가 신청(LEAVE)만 지원 - 구매 요청(PURCHASE) 상세 화면은
                     // 디자인 나오면 추가
                     const isDetailAvailable = approval.requestType === 'LEAVE';

                     return (
                        <tr
                           key={approval.approvalId}
                           onClick={
                              isDetailAvailable
                                 ? () =>
                                      router.push(`/approvals/${approval.approvalId}?tab=history`)
                                 : undefined
                           }
                           className={cn(
                              'border-b border-[#F3F4F6] last:border-b-0',
                              isDetailAvailable && 'cursor-pointer hover:bg-[#F9FAFB]',
                           )}
                        >
                           <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                           <td className="px-6 py-4 font-medium text-gray-900">{approval.title}</td>
                           <td className="px-6 py-4">
                              <div className="flex items-center justify-center">
                                 <StatusBadge tone={APPROVAL_STATUS_TONES[approval.status]}>
                                    {APPROVAL_STATUS_LABELS[approval.status]}
                                 </StatusBadge>
                              </div>
                           </td>
                           <td className="px-6 py-4 text-center text-gray-500">
                              {format(new Date(approval.requestedAt), 'yyyy-MM-dd')}
                           </td>
                        </tr>
                     );
                  })
               )}
            </tbody>
         </table>
      </div>
   );
}
