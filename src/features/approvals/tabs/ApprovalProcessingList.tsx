'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Download } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Pagination from '@/components/ui/Pagination';
import AnimatedHeight from '@/components/ui/loading/AnimatedHeight';
import { Skeleton } from '@/components/ui/loading/Skeleton';
import StatusBadge from '@/features/submissions/components/StatusBadge';
import { useApprovalList } from '../hooks/useApprovalList';
import { useApprovalPdfDownload } from '../hooks/useApprovalPdfDownload';
import { formatApprovalDate } from '../formatApprovalDate';
import { APPROVAL_STATUS_LABELS, APPROVAL_STATUS_TONES } from '../types';
import type { ApprovalSummary } from '@/services/approval.service';

const PAGE_SIZE = 8;

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
   const { approvals, isLoading, hasError, refetch } = useApprovalList('PROCESSING');
   const {
      isConfirmOpen,
      pendingRequestType,
      isSubmitting,
      openConfirm,
      closeConfirm,
      confirmDownload,
   } = useApprovalPdfDownload({ onAssigned: refetch });
   const isPendingConfirmForPurchase = pendingRequestType === 'PURCHASE';
   const [currentPage, setCurrentPage] = useState(1);

   const totalPages = Math.max(1, Math.ceil(approvals.length / PAGE_SIZE));
   const pagedApprovals = approvals.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

   return (
      <>
         <div className="overflow-hidden rounded-sm border border-[#E5E7EB] bg-white">
            <AnimatedHeight transitionKey={isLoading ? 'loading' : hasError ? 'error' : 'content'}>
               {isLoading ? (
                  <table className="w-full table-fixed text-left text-sm">
                     <thead>
                        <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
                           <th className="w-[6%] px-8 py-3 text-center font-medium">#</th>
                           <th className="w-[14%] px-6 py-3 text-center font-medium">결재 항목</th>
                           <th className="w-[12%] px-6 py-3 font-medium">신청인</th>
                           <th className="w-[12%] px-6 py-3 font-medium">담당자</th>
                           <th className="w-[18%] px-6 py-3 font-medium">요약</th>
                           <th className="w-[10%] px-6 py-3 text-center font-medium">처리 상태</th>
                           <th className="w-[12%] px-6 py-3 text-center font-medium">신청일자</th>
                           <th className="w-[16%] px-6 py-3 font-medium text-center"></th>
                        </tr>
                     </thead>
                     <tbody>
                        {[0, 1, 2, 3, 4].map((i) => (
                           <tr key={i} className="border-b border-[#F3F4F6] last:border-b-0">
                              <td className="px-8 py-3">
                                 <Skeleton width={16} height={14} className="mx-auto rounded-md" />
                              </td>
                              <td className="px-6 py-3">
                                 <Skeleton width="70%" height={14} className="mx-auto rounded-md" />
                              </td>
                              <td className="px-6 py-3">
                                 <Skeleton width="60%" height={14} className="rounded-md" />
                              </td>
                              <td className="px-6 py-3">
                                 <Skeleton width="50%" height={14} className="rounded-md" />
                              </td>
                              <td className="px-6 py-3">
                                 <Skeleton width="70%" height={14} className="rounded-md" />
                              </td>
                              <td className="px-6 py-3">
                                 <Skeleton width={56} height={22} className="mx-auto rounded-xs" />
                              </td>
                              <td className="px-6 py-4">
                                 <Skeleton width={72} height={14} className="mx-auto rounded-md" />
                              </td>
                              <td className="px-6 py-4" />
                           </tr>
                        ))}
                     </tbody>
                  </table>
               ) : hasError ? (
                  <div className="flex flex-col items-center gap-3 px-6 py-16">
                     <p className="text-sm text-gray-400">
                        결재 처리 목록을 불러오는데 실패했습니다.
                     </p>
                     <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="cursor-pointer rounded-xs border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                     >
                        새로고침
                     </button>
                  </div>
               ) : approvals.length === 0 ? (
                  <p className="px-6 py-10 text-center text-gray-400">
                     처리할 결재 내역이 없습니다.
                  </p>
               ) : (
                  <>
                     {/* 좁은 화면 - 카드형 목록 */}
                     <div className="divide-y divide-[#F3F4F6] md:hidden">
                        {pagedApprovals.map((approval) => {
                           const isActionable = approval.status === 'PENDING';

                           return (
                              <div
                                 key={approval.approvalId}
                                 onClick={() => router.push(`/approvals/${approval.approvalId}`)}
                                 className="cursor-pointer p-4 hover:bg-[#F9FAFB]"
                              >
                                 <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-medium text-gray-900">
                                       {approval.title}
                                    </p>
                                    <StatusBadge tone={APPROVAL_STATUS_TONES[approval.status]}>
                                       {APPROVAL_STATUS_LABELS[approval.status]}
                                    </StatusBadge>
                                 </div>
                                 <p className="mt-1.5 text-xs text-gray-500">
                                    {formatRequesterLabel(approval)} →{' '}
                                    {approval.approverName ?? '—'}
                                 </p>
                                 <p className="mt-1 text-xs text-gray-700">
                                    {formatSummary(approval)}
                                 </p>
                                 <div className="mt-2 flex items-center justify-between gap-2">
                                    <span className="text-xs text-gray-400">
                                       {formatApprovalDate(approval.requestedAt)}
                                    </span>
                                    {isActionable && (
                                       <button
                                          type="button"
                                          onClick={(event) => {
                                             event.stopPropagation();
                                             openConfirm(approval.approvalId, approval.requestType);
                                          }}
                                          className="flex cursor-pointer items-center gap-1 rounded-xs bg-brand-green px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#4D655A]"
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
                                    )}
                                 </div>
                              </div>
                           );
                        })}
                     </div>

                     {/* 넓은 화면 - 테이블 */}
                     <table className="hidden w-full table-fixed text-left text-sm md:table">
                        <thead>
                           <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
                              <th className="w-[6%] px-8 py-3 text-center font-medium">#</th>
                              <th className="w-[14%] px-6 py-3 text-center font-medium">
                                 결재 항목
                              </th>
                              <th className="w-[12%] px-6 py-3 font-medium">신청인</th>
                              <th className="w-[12%] px-6 py-3 font-medium">담당자</th>
                              <th className="w-[18%] px-6 py-3 font-medium">요약</th>
                              <th className="w-[10%] px-6 py-3 text-center font-medium">
                                 처리 상태
                              </th>
                              <th className="w-[12%] px-6 py-3 text-center font-medium">
                                 신청일자
                              </th>
                              <th className="w-[16%] px-6 py-3 font-medium text-center"></th>
                           </tr>
                        </thead>
                        <tbody>
                           {pagedApprovals.map((approval, index) => {
                              const isActionable = approval.status === 'PENDING';
                              const rowNumber = (currentPage - 1) * PAGE_SIZE + index + 1;

                              return (
                                 <tr
                                    key={approval.approvalId}
                                    onClick={() => router.push(`/approvals/${approval.approvalId}`)}
                                    className="cursor-pointer border-b border-[#F3F4F6] last:border-b-0 hover:bg-[#F9FAFB]"
                                 >
                                    <td className="px-8 py-3 text-center text-gray-500">
                                       {rowNumber}
                                    </td>
                                    <td className="px-6 py-3 text-center font-medium text-gray-900">
                                       {approval.title}
                                    </td>
                                    <td className="px-6 py-3 text-gray-700">
                                       {formatRequesterLabel(approval)}
                                    </td>
                                    <td className="px-6 py-3 text-gray-700">
                                       {approval.approverName ?? '—'}
                                    </td>
                                    <td className="px-6 py-3 text-gray-700">
                                       {formatSummary(approval)}
                                    </td>
                                    <td className="px-6 py-3">
                                       <div className="flex items-center justify-center">
                                          <StatusBadge
                                             tone={APPROVAL_STATUS_TONES[approval.status]}
                                          >
                                             {APPROVAL_STATUS_LABELS[approval.status]}
                                          </StatusBadge>
                                       </div>
                                    </td>
                                    <td className="px-6 py-4 text-center text-gray-500">
                                       {formatApprovalDate(approval.requestedAt)}
                                    </td>
                                    <td className="px-6 py-4">
                                       {isActionable && (
                                          <div className="flex items-center justify-center">
                                             <button
                                                type="button"
                                                onClick={(event) => {
                                                   event.stopPropagation();
                                                   openConfirm(
                                                      approval.approvalId,
                                                      approval.requestType,
                                                   );
                                                }}
                                                className="flex cursor-pointer items-center gap-1 rounded-xs bg-brand-green px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#4D655A]"
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
                           })}
                        </tbody>
                     </table>
                  </>
               )}
            </AnimatedHeight>
         </div>

         <div className="mt-6">
            <Pagination
               currentPage={currentPage}
               totalPages={totalPages}
               onPageChange={setCurrentPage}
            />
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
            busy={isSubmitting}
            onConfirm={confirmDownload}
            onClose={closeConfirm}
         />
      </>
   );
}
