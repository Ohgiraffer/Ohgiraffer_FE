'use client';

import { useRef, useState } from 'react';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import { createLeaveApproval } from '@/services/approval.service';
import type { LeaveRequestFormData } from '../types';

// 잔여 휴가 일수 조회 API가 아직 없어 임시로 하드코딩 (백엔드 준비되면 연동)
const MOCK_REMAINING_LEAVE_DAYS = 3;

const INITIAL_FORM: LeaveRequestFormData = {
   startDate: '',
   endDate: '',
};

export function useLeaveRequestForm() {
   const [form, setForm] = useState<LeaveRequestFormData>(INITIAL_FORM);
   // 전자 서명은 계정에 등록된 별도 자산이라(SignatureUpload가 조회/등록/삭제를 직접 처리) 여기서는
   // "등록되어 있는지"만 콜백으로 전달받아 들고 있는다
   const [hasSignature, setHasSignature] = useState(false);
   // "신청하기"를 한 번이라도 눌러본 적 있는지 - 그 이후부터 날짜 역전 에러를 실시간으로 보여주기 위한 플래그
   const [submitAttempted, setSubmitAttempted] = useState(false);
   const [isConfirmOpen, setIsConfirmOpen] = useState(false);
   // 더블클릭으로 인한 중복 제출 방지 - state는 비동기라 클릭 시점에 바로 막아줄 동기 가드가 필요
   const isSubmittingRef = useRef(false);

   const updateField = <K extends keyof LeaveRequestFormData>(
      field: K,
      value: LeaveRequestFormData[K],
   ) => {
      setForm((prev) => ({ ...prev, [field]: value }));
   };

   const hasDateOrderError =
      Boolean(form.startDate) && Boolean(form.endDate) && form.startDate > form.endDate;

   const isFilled = Boolean(form.startDate && form.endDate && hasSignature);

   // "신청하기" 클릭 - 검증 통과 시 바로 제출하지 않고 확인 모달을 띄운다
   const submit = () => {
      if (!isFilled) return;
      if (hasDateOrderError) {
         setSubmitAttempted(true);
         return;
      }

      setIsConfirmOpen(true);
   };

   // 확인 모달의 [확인] - 실제 제출. 담당자는 신청 시점에 지정하지 않고, 결재 처리 화면에서
   // 강사/매니저가 [확인]을 누른 시점에 배정된다
   const confirmSubmit = async () => {
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;

      try {
         await createLeaveApproval({ startDate: form.startDate, endDate: form.endDate });
         toast.success('휴가 결재 서류를 신청했습니다.');
         setIsConfirmOpen(false);
         setForm(INITIAL_FORM);
         setSubmitAttempted(false);
      } catch (err) {
         toast.error(
            err instanceof ApiError
               ? err.message
               : '휴가 신청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
         );
      } finally {
         isSubmittingRef.current = false;
      }
   };

   // 확인 모달의 [취소]/닫기 - 아무 것도 제출하지 않고 모달만 닫는다
   const cancelSubmit = () => setIsConfirmOpen(false);

   return {
      form,
      updateField,
      hasSignature,
      setHasSignature,
      isFilled,
      dateOrderError: submitAttempted && hasDateOrderError,
      isConfirmOpen,
      submit,
      confirmSubmit,
      cancelSubmit,
      remainingLeaveDays: MOCK_REMAINING_LEAVE_DAYS,
   };
}
