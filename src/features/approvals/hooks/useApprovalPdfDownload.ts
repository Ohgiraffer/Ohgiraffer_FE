'use client';

import { useRef, useState } from 'react';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import {
   checkApproval,
   downloadApprovalPdf,
   type ApprovalRequestType,
} from '@/services/approval.service';

type Options = {
   onAssigned?: (approvalId: number) => void;
};

type PendingRequest = { approvalId: number; requestType: ApprovalRequestType } | null;

function triggerBlobDownload(blob: Blob, filename: string | null) {
   const url = URL.createObjectURL(blob);
   const a = document.createElement('a');
   a.href = url;
   a.download = filename ?? '결재_신청서.pdf';
   a.click();
   URL.revokeObjectURL(url);
}

export function useApprovalPdfDownload({ onAssigned }: Options = {}) {
   const [pending, setPending] = useState<PendingRequest>(null);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const isSubmittingRef = useRef(false);

   const assignedApprovalIdRef = useRef<number | null>(null);

   const openConfirm = (approvalId: number, requestType: ApprovalRequestType) =>
      setPending({ approvalId, requestType });

   const closeConfirm = () => {
      if (isSubmittingRef.current) return;
      setPending(null);
      assignedApprovalIdRef.current = null;
   };

   const confirmDownload = async () => {
      if (pending === null || isSubmittingRef.current) return;
      const { approvalId, requestType } = pending;
      isSubmittingRef.current = true;
      setIsSubmitting(true);

      try {
         if (assignedApprovalIdRef.current !== approvalId) {
            await checkApproval(approvalId);
            assignedApprovalIdRef.current = approvalId;
            onAssigned?.(approvalId);
         }

         if (requestType === 'LEAVE') {
            const { blob, filename } = await downloadApprovalPdf(approvalId);
            triggerBlobDownload(blob, filename);
            toast.success('담당자로 배정되고 PDF 다운로드가 시작되었습니다.');
         } else {
            toast.success('담당자로 배정되었습니다.');
         }

         assignedApprovalIdRef.current = null;
         setPending(null);
      } catch (err) {
         const message = err instanceof ApiError ? err.message : null;

         if (assignedApprovalIdRef.current === approvalId) {
            toast.error(
               message
                  ? `담당자 배정은 완료되었습니다. ${message}`
                  : '담당자 배정은 완료되었지만 PDF 다운로드에 실패했습니다. 다시 시도해주세요.',
            );
         } else {
            toast.error(
               message ?? '담당자 배정 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
            );
         }
      } finally {
         isSubmittingRef.current = false;
         setIsSubmitting(false);
      }
   };

   return {
      isConfirmOpen: pending !== null,
      pendingRequestType: pending?.requestType ?? null,
      isSubmitting,
      openConfirm,
      closeConfirm,
      confirmDownload,
   };
}
