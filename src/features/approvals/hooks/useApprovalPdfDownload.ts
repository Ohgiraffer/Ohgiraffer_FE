'use client';

import { useRef, useState } from 'react';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import { checkApproval, downloadApprovalPdf } from '@/services/approval.service';

type Options = {
   // 담당자 배정(확인 처리)까지 성공한 뒤 호출됨 - 다운로드 자체가 실패해도 상태는 이미 CHECKED로
   // 바뀐 상태라, 목록/상세 화면을 최신 상태로 갱신하기 위해 필요
   onAssigned?: (approvalId: number) => void;
};

function triggerBlobDownload(blob: Blob, filename: string | null) {
   const url = URL.createObjectURL(blob);
   const a = document.createElement('a');
   a.href = url;
   a.download = filename ?? '결재_신청서.pdf';
   a.click();
   URL.revokeObjectURL(url);
}

// 매니저(추후 강사) "결재 처리" 목록·상세 화면에서 공용으로 쓰는 "PDF 다운로드 = 담당자 배정" 확인 모달 상태.
// [확인]을 누르기 전(모달이 열리는 시점)에는 아무 API도 호출하지 않는다.
// 담당자 배정(PATCH /check)을 먼저 성공시키고, 그 다음 PDF 다운로드(GET /pdf)를 이어서 호출한다 -
// 사용자에게는 "처리 중" 상태 하나만 보여주고 두 호출이 끝난 뒤 결과를 한 번에 안내한다.
export function useApprovalPdfDownload({ onAssigned }: Options = {}) {
   const [pendingApprovalId, setPendingApprovalId] = useState<number | null>(null);
   const [isSubmitting, setIsSubmitting] = useState(false);
   // 배정에는 성공했지만 다운로드만 실패한 경우 - 재시도 시 배정 API를 다시 부르지 않고 다운로드만 재시도
   const assignedApprovalIdRef = useRef<number | null>(null);

   const openConfirm = (approvalId: number) => setPendingApprovalId(approvalId);

   const closeConfirm = () => {
      if (isSubmitting) return;
      setPendingApprovalId(null);
      assignedApprovalIdRef.current = null;
   };

   const confirmDownload = async () => {
      if (pendingApprovalId === null || isSubmitting) return;
      const approvalId = pendingApprovalId;
      setIsSubmitting(true);

      try {
         if (assignedApprovalIdRef.current !== approvalId) {
            await checkApproval(approvalId);
            assignedApprovalIdRef.current = approvalId;
            onAssigned?.(approvalId);
         }

         const { blob, filename } = await downloadApprovalPdf(approvalId);
         triggerBlobDownload(blob, filename);

         toast.success('담당자로 배정되고 PDF 다운로드가 시작되었습니다.');
         assignedApprovalIdRef.current = null;
         setPendingApprovalId(null);
      } catch (err) {
         const message = err instanceof ApiError ? err.message : null;

         if (assignedApprovalIdRef.current === approvalId) {
            // 담당자 배정은 이미 끝난 상태 - 모달은 열어둔 채 다운로드만 다시 시도할 수 있게 둔다
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
         setIsSubmitting(false);
      }
   };

   return {
      isConfirmOpen: pendingApprovalId !== null,
      isSubmitting,
      openConfirm,
      closeConfirm,
      confirmDownload,
   };
}
