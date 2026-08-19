'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/features/submissions/components/StatusBadge';
import Pagination from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/loading/Skeleton';
import { useApprovalList } from '../hooks/useApprovalList';
import { formatApprovalDate } from '../formatApprovalDate';
import { APPROVAL_STATUS_LABELS, APPROVAL_STATUS_TONES } from '../types';

const PAGE_SIZE = 10;

// 훈련생(휴가)/강사(구매 예산) 공용 "결재 이력" 탭 - 내가 신청한 결재 목록(REQUESTED)만 조회
export default function ApprovalHistoryList() {
   const router = useRouter();
   const { approvals, isLoading, hasError } = useApprovalList('REQUESTED');
   const [currentPage, setCurrentPage] = useState(1);

   const totalPages = Math.max(1, Math.ceil(approvals.length / PAGE_SIZE));
   const pagedApprovals = approvals.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

   return (
      <>
         <div className="overflow-hidden rounded-sm border border-[#E5E7EB] bg-white">
            {isLoading ? (
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
                     {[0, 1, 2, 3, 4].map((i) => (
                        <tr key={i} className="border-b border-[#F3F4F6] last:border-b-0">
                           <td className="px-8 py-3"><Skeleton width={16} height={14} className="mx-auto rounded-md" /></td>
                           <td className="px-15 py-3"><Skeleton width="60%" height={14} className="rounded-md" /></td>
                           <td className="px-6 py-3"><Skeleton width="50%" height={14} className="rounded-md" /></td>
                           <td className="px-6 py-3"><Skeleton width={56} height={22} className="mx-auto rounded-xs" /></td>
                           <td className="px-6 py-3"><Skeleton width={72} height={14} className="mx-auto rounded-md" /></td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            ) : hasError ? (
               <div className="flex flex-col items-center gap-3 px-6 py-16">
                  <p className="text-sm text-gray-400">결재 이력을 불러오는데 실패했습니다.</p>
                  <button
                     type="button"
                     onClick={() => window.location.reload()}
                     className="cursor-pointer rounded-xs border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                     새로고침
                  </button>
               </div>
            ) : approvals.length === 0 ? (
               <p className="px-6 py-10 text-center text-gray-400">신청한 결재 내역이 없습니다.</p>
            ) : (
               <>
                  {/* 좁은 화면 - 카드형 목록 */}
                  <div className="divide-y divide-[#F3F4F6] md:hidden">
                     {pagedApprovals.map((approval) => (
                        <div
                           key={approval.approvalId}
                           onClick={() => router.push(`/approvals/${approval.approvalId}?tab=history`)}
                           className="cursor-pointer p-4 hover:bg-[#F9FAFB]"
                        >
                           <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-gray-900">{approval.title}</p>
                              <StatusBadge tone={APPROVAL_STATUS_TONES[approval.status]}>
                                 {APPROVAL_STATUS_LABELS[approval.status]}
                              </StatusBadge>
                           </div>
                           <p className="mt-1.5 text-xs text-gray-500">
                              {approval.approverName ?? '—'} ·{' '}
                              {formatApprovalDate(approval.requestedAt)}
                           </p>
                        </div>
                     ))}
                  </div>

                  {/* 넓은 화면 - 테이블 */}
                  <table className="hidden w-full table-fixed text-left text-sm md:table">
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
                        {pagedApprovals.map((approval, index) => (
                           <tr
                              key={approval.approvalId}
                              onClick={() =>
                                 router.push(`/approvals/${approval.approvalId}?tab=history`)
                              }
                              className="cursor-pointer border-b border-[#F3F4F6] last:border-b-0 hover:bg-[#F9FAFB]"
                           >
                              <td className="px-8 py-3 text-center text-gray-500">
                                 {(currentPage - 1) * PAGE_SIZE + index + 1}
                              </td>
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
                                 {formatApprovalDate(approval.requestedAt)}
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </>
            )}
         </div>

         <div className="mt-6">
            <Pagination
               currentPage={currentPage}
               totalPages={totalPages}
               onPageChange={setCurrentPage}
            />
         </div>
      </>
   );
}
