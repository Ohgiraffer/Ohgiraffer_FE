'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, ChevronLeft, Download } from 'lucide-react';
import { differenceInCalendarDays, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import { useAuth } from '@/components/auth/AuthContext';
import ConfirmModal from '@/components/ui/ConfirmModal';
import InlineProgressBar from '@/components/ui/loading/InlineProgressBar';
import StatusBadge from '@/features/submissions/components/StatusBadge';
import {
   approveApproval,
   getApprovalDetail,
   rejectApproval,
   type ApprovalDetail,
} from '@/services/approval.service';
import ApprovalStatusTimeline from './ApprovalStatusTimeline';
import RejectReasonModal from './RejectReasonModal';
import { useApprovalFocusRefetch } from '../hooks/useApprovalFocusRefetch';
import { useApprovalPdfDownload } from '../hooks/useApprovalPdfDownload';
import { formatApprovalDate } from '../formatApprovalDate';
import { APPROVAL_STATUS_LABELS, APPROVAL_STATUS_TONES } from '../types';

interface ApprovalDetailClientProps {
   approvalId: string;
}

// 시작·종료일이 유효한 날짜일 때만 일수를 계산 - 둘 중 하나라도 이상한 값이면 '-'
function formatLeaveDays(startDate: string, endDate: string) {
   const start = new Date(startDate);
   const end = new Date(endDate);
   if (!isValid(start) || !isValid(end)) return '-';
   return `${differenceInCalendarDays(end, start) + 1}일`;
}

function formatAmount(amount: number) {
   return `₩${amount.toLocaleString('ko-KR')}`;
}

function InfoField({
   label,
   value,
   valueClassName,
}: {
   label: string;
   value: React.ReactNode;
   valueClassName?: string;
}) {
   return (
      <div>
         <p className="text-[12px] text-[#9CA3AF]">{label}</p>
         <p className={cn('mt-1 text-[15px] text-gray-900', valueClassName)}>{value}</p>
      </div>
   );
}

export default function ApprovalDetailClient({ approvalId }: ApprovalDetailClientProps) {
   const { role } = useAuth();
   const router = useRouter();
   const numericApprovalId = Number(approvalId);
   const isProcessor = role === 'MANAGER';

   const [detail, setDetail] = useState<ApprovalDetail | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [hasError, setHasError] = useState(false);
   const [retryKey, setRetryKey] = useState(0);
   // 한 번이라도 정상적으로 불러온 적이 있는지 - 승인/반려/확인 직후의 조용한 재조회가 실패했을 때
   // 이미 보여주고 있던 정상 데이터를 에러 화면으로 덮을지(최초 로드 실패) 토스트로만 알릴지 구분한다
   const hasLoadedOnceRef = useRef(false);

   const silentRefetch = () => setRetryKey((key) => key + 1);

   const {
      isConfirmOpen: isDownloadConfirmOpen,
      pendingRequestType: downloadPendingRequestType,
      isSubmitting: isDownloadSubmitting,
      openConfirm: openDownloadConfirm,
      closeConfirm: closeDownloadConfirm,
      confirmDownload,
   } = useApprovalPdfDownload({ onAssigned: silentRefetch });
   const isDownloadConfirmForPurchase = downloadPendingRequestType === 'PURCHASE';
   const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false);
   const [isApproveSubmitting, setIsApproveSubmitting] = useState(false);
   const isApproveSubmittingRef = useRef(false);
   const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
   const [isRejectSubmitting, setIsRejectSubmitting] = useState(false);

   useEffect(() => {
      if (!Number.isInteger(numericApprovalId)) return;
      let isMounted = true;

      getApprovalDetail(numericApprovalId)
         .then((data) => {
            if (!isMounted) return;
            setDetail(data);
            setHasError(false);
            hasLoadedOnceRef.current = true;
         })
         .catch((err) => {
            if (!isMounted) return;
            if (
               err instanceof ApiError &&
               (err.code === 'APPROVAL_003' || err.code === 'APPROVAL_001')
            ) {
               toast.error(err.message);
               router.replace('/approvals?tab=history');
               return;
            }
            // 이미 한 번 정상적으로 불러온 뒤라면(승인/반려/확인 직후의 조용한 재조회 등) 화면을
            // 전부 에러로 덮지 않고 토스트로만 알린다 - 최초 로드 실패일 때만 에러 화면을 보여준다
            if (hasLoadedOnceRef.current) {
               toast.error(
                  err instanceof ApiError
                     ? err.message
                     : '최신 결재 정보를 불러오지 못했습니다. 새로고침해주세요.',
               );
            } else {
               setHasError(true);
            }
         })
         .finally(() => {
            if (isMounted) setIsLoading(false);
         });

      return () => {
         isMounted = false;
      };
   }, [numericApprovalId, retryKey, router]);

   const retry = () => {
      setIsLoading(true);
      setHasError(false);
      setRetryKey((key) => key + 1);
   };

   useApprovalFocusRefetch(
      numericApprovalId,
      detail?.status,
      !isProcessor && Boolean(detail) && !hasError,
      setDetail,
   );

   const handleApprove = async () => {
      if (isApproveSubmittingRef.current) return;
      isApproveSubmittingRef.current = true;
      setIsApproveSubmitting(true);

      try {
         await approveApproval(numericApprovalId);
         toast.success('결재를 승인했습니다.');
         setIsApproveConfirmOpen(false);
         silentRefetch();
      } catch (err) {
         toast.error(
            err instanceof ApiError
               ? err.message
               : '승인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
         );
      } finally {
         isApproveSubmittingRef.current = false;
         setIsApproveSubmitting(false);
      }
   };

   const handleReject = async (reason: string) => {
      if (isRejectSubmitting) return;
      setIsRejectSubmitting(true);

      try {
         await rejectApproval(numericApprovalId, reason);
         toast.success('결재를 반려했습니다.');
         setIsRejectModalOpen(false);
         silentRefetch();
      } catch (err) {
         toast.error(
            err instanceof ApiError
               ? err.message
               : '반려 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
         );
      } finally {
         setIsRejectSubmitting(false);
      }
   };

   if (!Number.isInteger(numericApprovalId)) {
      return (
         <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
            <Link
               href="/approvals?tab=history"
               className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
               <ChevronLeft size={16} />
               목록으로 돌아가기
            </Link>
            <p className="mt-10 text-center text-sm text-gray-400">결재 요청을 찾을 수 없습니다.</p>
         </div>
      );
   }

   return (
      <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
         <Link
            href="/approvals?tab=history"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
         >
            <ChevronLeft size={16} />
            목록으로 돌아가기
         </Link>
         <h1 className="mt-3 text-2xl font-bold text-gray-900">
            {isProcessor ? '결재 상세' : '결재 이력 상세'}
         </h1>

         {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16">
               <InlineProgressBar />
               <p className="text-sm text-gray-400">불러오는 중...</p>
            </div>
         ) : hasError || !detail ? (
            <div className="flex flex-col items-center gap-3 py-16">
               <p className="text-sm text-gray-400">결재 정보를 불러오지 못했습니다.</p>
               <button
                  type="button"
                  onClick={retry}
                  className="cursor-pointer rounded-xs border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
               >
                  다시 시도
               </button>
            </div>
         ) : (
            <div className="mt-5 rounded-sm border border-[#E5E7EB] bg-white px-4 py-6 sm:px-15 sm:py-8">
               <div className="mt-5 sm:px-25">
                  <ApprovalStatusTimeline
                     status={detail.status}
                     approverName={detail.approverName}
                     confirmedAt={detail.confirmedAt}
                     processedAt={detail.processedAt}
                  />
               </div>

               <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-6 border-t border-[#F3F4F6] pt-8 sm:grid-cols-2">
                  {isProcessor ? (
                     <InfoField label="신청자" value={detail.requesterName} />
                  ) : (
                     <InfoField label="신청 유형" value={detail.title} />
                  )}
                  <InfoField label="신청일자" value={formatApprovalDate(detail.requestedAt)} />

                  {detail.requestType === 'PURCHASE' ? (
                     <>
                        <InfoField label="카테고리" value={detail.budgetCategoryName ?? '-'} />
                        <InfoField label="사용 목적" value={detail.reason ?? '-'} />
                        <InfoField
                           label="요청 금액"
                           valueClassName="font-semibold"
                           value={detail.amount != null ? formatAmount(detail.amount) : '-'}
                        />
                     </>
                  ) : (
                     <>
                        <InfoField
                           label="휴가 시작일"
                           value={detail.startDate ? formatApprovalDate(detail.startDate) : '-'}
                        />
                        <InfoField
                           label="휴가 종료일"
                           value={detail.endDate ? formatApprovalDate(detail.endDate) : '-'}
                        />
                        <InfoField
                           label="총 휴가 일수"
                           valueClassName="font-semibold"
                           value={
                              detail.startDate && detail.endDate
                                 ? formatLeaveDays(detail.startDate, detail.endDate)
                                 : '-'
                           }
                        />
                     </>
                  )}

                  <div>
                     <p className="text-xs text-gray-400">처리 상태</p>
                     <div className="mt-1">
                        <StatusBadge tone={APPROVAL_STATUS_TONES[detail.status]}>
                           {APPROVAL_STATUS_LABELS[detail.status]}
                        </StatusBadge>
                     </div>
                  </div>
               </div>

               {isProcessor && detail.signatureImage && (
                  <div className="mt-6">
                     <p className="text-[15px] font-semibold text-gray-900">전자 서명</p>
                     <div className="mt-2 flex h-35 items-center justify-center overflow-hidden rounded-sm border border-[#E5E7EB] bg-[#F9FAFB]">
                        <img
                           src={detail.signatureImage}
                           alt="신청자 전자서명"
                           className="h-full w-full object-contain"
                        />
                     </div>
                  </div>
               )}

               {detail.status === 'REJECTED' && detail.rejectionReason && (
                  <div className="mt-6 rounded-xs border border-[#F5DFDC] bg-[#FDF4F3] px-4 py-3 text-sm text-brand-maroon">
                     <span className="font-semibold">반려 사유</span>
                     <p className="mt-1">{detail.rejectionReason}</p>
                  </div>
               )}

               {isProcessor && detail.status === 'PENDING' && (
                  <div className="mt-6 flex justify-end border-t border-[#F3F4F6] pt-6">
                     <button
                        type="button"
                        onClick={() => openDownloadConfirm(numericApprovalId, detail.requestType)}
                        className="flex cursor-pointer items-center gap-1.5 rounded-xs bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-[#4D655A]"
                     >
                        {detail.requestType === 'LEAVE' ? (
                           <>
                              <Download size={14} />
                              PDF 다운로드
                           </>
                        ) : (
                           <>
                              <Check size={14} />
                              확인
                           </>
                        )}
                     </button>
                  </div>
               )}

               {isProcessor && detail.status === 'CHECKED' && (
                  <div className="mt-6 flex justify-end gap-2 border-t border-[#F3F4F6] pt-6">
                     <button
                        type="button"
                        onClick={() => setIsRejectModalOpen(true)}
                        className="cursor-pointer rounded-xs border border-[#E5E7EB] px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                     >
                        반려
                     </button>
                     <button
                        type="button"
                        onClick={() => setIsApproveConfirmOpen(true)}
                        className="cursor-pointer rounded-xs bg-brand-green px-5 py-2 text-sm font-semibold text-white hover:bg-[#4D655A]"
                     >
                        승인
                     </button>
                  </div>
               )}
            </div>
         )}

         <ConfirmModal
            open={isDownloadConfirmOpen}
            title={
               isDownloadConfirmForPurchase
                  ? '구매 요청을 확인하시겠습니까?'
                  : 'PDF를 다운로드 받으시겠습니까?'
            }
            description={
               isDownloadConfirmForPurchase
                  ? "확인하시면 해당 결재의 담당자로 배정되고, 결재 서류의 상태가 '확인중'으로 변경됩니다."
                  : "PDF 서류를 다운로드 받으면 해당 결재의 담당자로 배정되고, 결재 서류의 상태가 '확인중'으로 변경됩니다."
            }
            confirmLabel={isDownloadSubmitting ? '처리 중...' : '확인'}
            busy={isDownloadSubmitting}
            onConfirm={confirmDownload}
            onClose={closeDownloadConfirm}
         />
         <ConfirmModal
            open={isApproveConfirmOpen}
            title="결재를 승인하시겠습니까?"
            description="승인 처리 후 신청인에게 알림이 발송됩니다."
            confirmLabel={isApproveSubmitting ? '처리 중...' : '확인'}
            busy={isApproveSubmitting}
            onConfirm={handleApprove}
            onClose={() => setIsApproveConfirmOpen(false)}
         />
         {isRejectModalOpen && (
            <RejectReasonModal
               isSubmitting={isRejectSubmitting}
               onClose={() => !isRejectSubmitting && setIsRejectModalOpen(false)}
               onSubmit={handleReject}
            />
         )}
      </div>
   );
}
