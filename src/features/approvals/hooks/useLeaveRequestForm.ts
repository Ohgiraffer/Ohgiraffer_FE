'use client';

import { useEffect, useRef, useState } from 'react';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import {
   createLeaveApproval,
   getApprovalProfile,
   updateApprovalProfile,
} from '@/services/approval.service';
import { getLeaveSickCount } from '@/services/attendance.service';
import type { LeaveRequestFormData } from '../types';

const INITIAL_FORM: LeaveRequestFormData = {
   birthDate: '',
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

   // 이 페이지는 휴가 신청만 다루므로 잔여 병결(remainingSickDays)은 조회는 하되 화면에는 쓰지 않는다.
   // remainingLeaveDays가 null인 게 "로딩 중"과 "조회 실패" 둘 다를 가리키면 실패했을 때도 화면이
   // 계속 "불러오는 중..."으로 보여서, 실패 여부를 별도 state로 구분한다
   const [remainingLeaveDays, setRemainingLeaveDays] = useState<number | null>(null);
   const [hasLeaveDaysError, setHasLeaveDaysError] = useState(false);

   useEffect(() => {
      let isMounted = true;

      getLeaveSickCount()
         .then((data) => {
            if (isMounted) setRemainingLeaveDays(data.remainingLeaveDays);
         })
         .catch((err) => {
            if (!isMounted) return;
            setHasLeaveDaysError(true);
            toast.error(
               err instanceof ApiError
                  ? err.message
                  : '잔여 휴가 일수를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
            );
         });

      return () => {
         isMounted = false;
      };
   }, []);

   // 전화번호는 사용자 기본 정보 값을 그대로 보여주기만 함(수정 불가) - 로딩/실패를 phoneNumber가
   // null인 것과 구분하기 위해 별도 상태로 관리
   const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
   const [isLoadingProfile, setIsLoadingProfile] = useState(true);
   const [hasProfileError, setHasProfileError] = useState(false);

   useEffect(() => {
      let isMounted = true;

      getApprovalProfile()
         .then((data) => {
            if (!isMounted) return;
            setPhoneNumber(data.phoneNumber);
            // 조회 응답이 도착하기 전에 사용자가 이미 생년월일을 입력했다면 그 입력을 덮어쓰지 않는다
            setForm((prev) => (prev.birthDate ? prev : { ...prev, birthDate: data.birthDate ?? '' }));
         })
         .catch((err) => {
            if (!isMounted) return;
            setHasProfileError(true);
            toast.error(
               err instanceof ApiError
                  ? err.message
                  : '결재 프로필을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
            );
         })
         .finally(() => {
            if (isMounted) setIsLoadingProfile(false);
         });

      return () => {
         isMounted = false;
      };
   }, []);

   const updateField = <K extends keyof LeaveRequestFormData>(
      field: K,
      value: LeaveRequestFormData[K],
   ) => {
      setForm((prev) => ({ ...prev, [field]: value }));
   };

   const hasDateOrderError =
      Boolean(form.startDate) && Boolean(form.endDate) && form.startDate > form.endDate;

   const isFilled = Boolean(form.birthDate && form.startDate && form.endDate && hasSignature);

   // "신청하기" 클릭 - 검증 통과 시 바로 제출하지 않고 확인 모달을 띄운다
   const submit = () => {
      if (!isFilled) return;
      if (hasDateOrderError) {
         setSubmitAttempted(true);
         return;
      }

      setIsConfirmOpen(true);
   };

   // 확인 모달의 [확인] - 실제 제출. 생년월일은 휴가 신청서에 딸린 값이 아니라 계정에 저장해두는
   // 결재 프로필이라, 실제 휴가 신청(createLeaveApproval) 전에 먼저 저장한다(문서에 명시된 순서).
   // 담당자는 신청 시점에 지정하지 않고, 결재 처리 화면에서 강사/매니저가 [확인]을 누른 시점에 배정된다
   const confirmSubmit = async () => {
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;

      try {
         await updateApprovalProfile({ birthDate: form.birthDate });
         await createLeaveApproval({ startDate: form.startDate, endDate: form.endDate });
         toast.success('휴가 결재 서류를 신청했습니다.');
         setIsConfirmOpen(false);
         // 생년월일은 계정에 저장된 값이라 다음 신청을 위해 지울 필요가 없음 - 휴가 기간만 초기화
         setForm((prev) => ({ ...prev, startDate: '', endDate: '' }));
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
      remainingLeaveDays,
      hasLeaveDaysError,
      phoneNumber,
      isLoadingProfile,
      hasProfileError,
   };
}
