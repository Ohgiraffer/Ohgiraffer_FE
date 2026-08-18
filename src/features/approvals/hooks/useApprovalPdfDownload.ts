'use client';

import { useRef, useState } from 'react';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import {
   checkApproval,
   downloadApprovalPdf,
   type ApprovalRequestType,
} from '@/services/approval.service';
import { getSignature } from '@/services/signature.service';

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

// 서명 등록 여부 확인 자체가 실패하면(네트워크 오류 등) 이 체크 때문에 결재 처리 흐름을
// 막지 않도록 등록된 것으로 간주하고 넘어간다 - 404(미등록)일 때만 명확히 false를 반환
async function hasRegisteredSignature(): Promise<boolean> {
   try {
      await getSignature();
      return true;
   } catch (err) {
      if (err instanceof ApiError && err.status === 404) return false;
      return true;
   }
}

export function useApprovalPdfDownload({ onAssigned }: Options = {}) {
   const [pending, setPending] = useState<PendingRequest>(null);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const isSubmittingRef = useRef(false);
   // 서명 등록 여부를 조회하는 동안 같은/다른 행을 연타해도 중복 조회·중복 토스트·요청
   // 순서 뒤바뀜으로 엉뚱한 행의 모달이 열리는 걸 막는 가드
   const isCheckingSignatureRef = useRef(false);

   const assignedApprovalIdRef = useRef<number | null>(null);

   const openConfirm = async (approvalId: number, requestType: ApprovalRequestType) => {
      if (isCheckingSignatureRef.current) return;

      if (requestType === 'LEAVE') {
         isCheckingSignatureRef.current = true;
         try {
            if (!(await hasRegisteredSignature())) {
               toast.warning('등록된 전자 서명 파일이 없어 PDF 다운로드가 불가능합니다.');
               return;
            }
         } finally {
            isCheckingSignatureRef.current = false;
         }
      }
      setPending({ approvalId, requestType });
   };

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
