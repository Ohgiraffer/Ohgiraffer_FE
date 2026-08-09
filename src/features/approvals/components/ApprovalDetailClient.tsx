'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Download } from 'lucide-react';
import { differenceInCalendarDays, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import { useAuth } from '@/components/auth/AuthContext';
import ConfirmModal from '@/components/ui/ConfirmModal';
import StatusBadge from '@/features/submissions/components/StatusBadge';
import {
   approveApproval,
   getApprovalDetail,
   rejectApproval,
   type ApprovalDetail,
} from '@/services/approval.service';
import ApprovalStatusTimeline from './ApprovalStatusTimeline';
import RejectReasonModal from './RejectReasonModal';
import { useApprovalPdfDownload } from '../hooks/useApprovalPdfDownload';
import { APPROVAL_STATUS_LABELS, APPROVAL_STATUS_TONES } from '../types';

interface ApprovalDetailClientProps {
   approvalId: string;
}

function formatDate(iso: string) {
   return format(new Date(iso), 'yyyy-MM-dd');
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

// 결재 이력 상세 - 훈련생의 휴가 신청 결재만 다룸. 강사/매니저의 구매 요청 결재 상세는
// 화면 디자인 나오면 requestType 분기로 추가할 예정
export default function ApprovalDetailClient({ approvalId }: ApprovalDetailClientProps) {
   const { role } = useAuth();
   const router = useRouter();
   const numericApprovalId = Number(approvalId);
   // 지금은 매니저만 결재 처리 화면을 가짐(강사 처리 탭은 아직 없음) - 나중에 강사도 처리 화면이
   // 생기면 이 조건에 추가
   const isProcessor = role === 'MANAGER';

   const [detail, setDetail] = useState<ApprovalDetail | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [hasError, setHasError] = useState(false);
   const [retryKey, setRetryKey] = useState(0);

   // 담당자 배정 성공 시 상세를 다시 불러온다 - "다시 시도" 버튼(retry)과 달리 로딩 화면으로
   // 전체를 갈아치우지 않고 조용히 최신 상태로 갈아끼운다(버튼 영역이 갑자기 사라졌다 나타나는 걸 방지)
   const silentRefetch = () => setRetryKey((key) => key + 1);

   const {
      isConfirmOpen: isDownloadConfirmOpen,
      isSubmitting: isDownloadSubmitting,
      openConfirm: openDownloadConfirm,
      closeConfirm: closeDownloadConfirm,
      confirmDownload,
   } = useApprovalPdfDownload({ onAssigned: silentRefetch });
   const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false);
   const [isApproveSubmitting, setIsApproveSubmitting] = useState(false);
   const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
   const [isRejectSubmitting, setIsRejectSubmitting] = useState(false);

   useEffect(() => {
      if (!Number.isInteger(numericApprovalId)) return;
      let isMounted = true;

      getApprovalDetail(numericApprovalId)
         .then((data) => {
            if (isMounted) setDetail(data);
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
            setHasError(true);
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

   const handleApprove = async () => {
      if (isApproveSubmitting) return;
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
            <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>
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
            <div className="mt-5 rounded-sm border border-[#E5E7EB] bg-white px-15 py-8">
               <div className="mt-5 px-25">
                  <ApprovalStatusTimeline
                     status={detail.status}
                     approverName={detail.approverName}
                     confirmedAt={detail.confirmedAt}
                     processedAt={detail.processedAt}
                     showCheckerCaption={isProcessor}
                  />
               </div>

               <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-[#F3F4F6] pt-8">
                  {isProcessor ? (
                     <InfoField label="신청자" value={detail.requesterName} />
                  ) : (
                     <InfoField label="신청 유형" value={detail.title} />
                  )}
                  <InfoField label="신청일자" value={formatDate(detail.requestedAt)} />
                  <InfoField
                     label="휴가 시작일"
                     value={detail.startDate ? formatDate(detail.startDate) : '-'}
                  />
                  <InfoField
                     label="휴가 종료일"
                     value={detail.endDate ? formatDate(detail.endDate) : '-'}
                  />
                  <InfoField
                     label="총 휴가 일수"
                     valueClassName="font-semibold"
                     value={
                        detail.startDate && detail.endDate
                           ? `${differenceInCalendarDays(new Date(detail.endDate), new Date(detail.startDate)) + 1}일`
                           : '-'
                     }
                  />
                  <div>
                     <p className="text-xs text-gray-400">처리 상태</p>
                     <div className="mt-1">
                        <StatusBadge tone={APPROVAL_STATUS_TONES[detail.status]}>
                           {APPROVAL_STATUS_LABELS[detail.status]}
                        </StatusBadge>
                     </div>
                  </div>
               </div>

               {/* 전자 서명 스냅샷 - 신청자가 이후 서명을 바꿔도 이 결재 시점의 서명은 그대로 유지됨.
                   처리 주체(매니저)가 신청자 서명을 확인할 수 있어야 해서 처리 화면에서만 보여줌 */}
               {isProcessor && detail.signatureImage && (
                  <div className="mt-6">
                     <p className="text-[15px] font-semibold text-gray-900">전자 서명</p>
                     <div className="mt-2 flex h-35 items-center justify-center overflow-hidden rounded-sm border border-[#E5E7EB] bg-[#F9FAFB]">
                        {/* eslint-disable-next-line @next/next/no-img-element -- 백엔드가 base64 data URI로 내려줘서 next/image 최적화 대상이 아님 */}
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
                        onClick={() => openDownloadConfirm(numericApprovalId)}
                        className="flex cursor-pointer items-center gap-1.5 rounded-sm bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-[#4D655A]"
                     >
                        <Download size={14} />
                        pdf 다운로드
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
            title="PDF를 다운로드 받으시겠습니까?"
            description="PDF 서류를 다운로드 받으면 해당 결재의 담당자로 배정되고, 결재 서류의 상태가 '확인중'으로 변경됩니다."
            confirmLabel={isDownloadSubmitting ? '처리 중...' : '확인'}
            onConfirm={confirmDownload}
            onClose={closeDownloadConfirm}
         />
         <ConfirmModal
            open={isApproveConfirmOpen}
            title="결재를 승인하시겠습니까?"
            description="승인 처리 후 신청인에게 알림이 발송됩니다."
            confirmLabel={isApproveSubmitting ? '처리 중...' : '확인'}
            onConfirm={handleApprove}
            onClose={() => !isApproveSubmitting && setIsApproveConfirmOpen(false)}
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
