'use client';

import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Check, Download } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import StatusBadge from '@/features/submissions/components/StatusBadge';
import { useApprovalList } from '../hooks/useApprovalList';
import { useApprovalPdfDownload } from '../hooks/useApprovalPdfDownload';
import { APPROVAL_STATUS_LABELS, APPROVAL_STATUS_TONES } from '../types';
import type { ApprovalSummary } from '@/services/approval.service';

// LEAVE는 훈련생만, PURCHASE는 강사만 신청 가능해서 requestType만으로 역할을 확정할 수 있다
function formatRequesterLabel(approval: ApprovalSummary) {
   return `${approval.requesterName} (${approval.requestType === 'LEAVE' ? '학생' : '강사'})`;
}

function formatSummary(approval: ApprovalSummary) {
   if (approval.requestType === 'LEAVE') {
      return approval.startDate && approval.endDate
         ? `${approval.startDate} ~ ${approval.endDate}`
         : '-';
   }
   if (approval.budgetCategoryName && approval.amount != null) {
      return `${approval.budgetCategoryName} · ₩${approval.amount.toLocaleString('ko-KR')}`;
   }
   return '-';
}

// 매니저 "결재 처리" 탭 - 처리 대상 결재 목록(PROCESSING) 조회
export default function ApprovalProcessingList() {
   const router = useRouter();
   const { approvals, isLoading, refetch } = useApprovalList('PROCESSING');
   const {
      isConfirmOpen,
      pendingRequestType,
      isSubmitting,
      openConfirm,
      closeConfirm,
      confirmDownload,
   } = useApprovalPdfDownload({ onAssigned: refetch });
   const isPendingConfirmForPurchase = pendingRequestType === 'PURCHASE';

   return (
      <>
         <div className="overflow-hidden rounded-sm border border-[#E5E7EB] bg-white">
            <table className="w-full table-fixed text-left text-sm">
               <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
                     <th className="w-[6%] px-8 py-3 text-center font-medium">#</th>
                     <th className="w-[16%] px-6 py-3 text-center font-medium">결재 항목</th>
                     <th className="w-[14%] px-6 py-3 font-medium">신청인</th>
                     <th className="w-[22%] px-6 py-3 font-medium">요약</th>
                     <th className="w-[10%] px-6 py-3 text-center font-medium">처리 상태</th>
                     <th className="w-[14%] px-6 py-3 text-center font-medium">신청일자</th>
                     <th className="w-[18%] px-6 py-3 font-medium text-center"></th>
                  </tr>
               </thead>
               <tbody>
                  {isLoading ? (
                     <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-gray-400">
                           불러오는 중...
                        </td>
                     </tr>
                  ) : approvals.length === 0 ? (
                     <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-gray-400">
                           처리할 결재 내역이 없습니다.
                        </td>
                     </tr>
                  ) : (
                     approvals.map((approval, index) => {
                        const isActionable = approval.status === 'PENDING';

                        return (
                           <tr
                              key={approval.approvalId}
                              onClick={() => router.push(`/approvals/${approval.approvalId}`)}
                              className="cursor-pointer border-b border-[#F3F4F6] last:border-b-0 hover:bg-[#F9FAFB]"
                           >
                              <td className="px-8 py-3 text-center text-gray-500">{index + 1}</td>
                              <td className="px-6 py-3 text-center font-medium text-gray-900">
                                 {approval.title}
                              </td>
                              <td className="px-6 py-3 text-gray-700">
                                 {formatRequesterLabel(approval)}
                              </td>
                              <td className="px-6 py-3 text-gray-700">{formatSummary(approval)}</td>
                              <td className="px-6 py-3">
                                 <div className="flex items-center justify-center">
                                    <StatusBadge tone={APPROVAL_STATUS_TONES[approval.status]}>
                                       {APPROVAL_STATUS_LABELS[approval.status]}
                                    </StatusBadge>
                                 </div>
                              </td>
                              <td className="px-6 py-4 text-center text-gray-500">
                                 {format(new Date(approval.requestedAt), 'yyyy-MM-dd')}
                              </td>
                              <td className="px-6 py-4">
                                 {isActionable && (
                                    <div className="flex items-center justify-center">
                                       <button
                                          type="button"
                                          onClick={(event) => {
                                             event.stopPropagation();
                                             openConfirm(approval.approvalId, approval.requestType);
                                          }}
                                          className="flex cursor-pointer items-center gap-1 rounded-sm bg-brand-green px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#4D655A]"
                                       >
                                          {approval.requestType === 'LEAVE' ? (
                                             <>
                                                <Download size={12} />
                                                PDF 다운로드
                                             </>
                                          ) : (
                                             <>
                                                <Check size={12} />
                                                확인
                                             </>
                                          )}
                                       </button>
                                    </div>
                                 )}
                              </td>
                           </tr>
                        );
                     })
                  )}
               </tbody>
            </table>
         </div>

         <ConfirmModal
            open={isConfirmOpen}
            title={
               isPendingConfirmForPurchase
                  ? '구매 요청을 확인하시겠습니까?'
                  : 'PDF를 다운로드 받으시겠습니까?'
            }
            description={
               isPendingConfirmForPurchase
                  ? "확인하시면 해당 결재의 담당자로 배정되고, 결재 서류의 상태가 '확인중'으로 변경됩니다."
                  : "PDF 서류를 다운로드 받으면 해당 결재의 담당자로 배정되고, 결재 서류의 상태가 '확인중'으로 변경됩니다."
            }
            confirmLabel={isSubmitting ? '처리 중...' : '확인'}
            onConfirm={confirmDownload}
            onClose={closeConfirm}
         />
      </>
   );
}
