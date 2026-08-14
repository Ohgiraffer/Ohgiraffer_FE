'use client';

import { useEffect, useRef, useState } from 'react';
import { format, isValid, parse } from 'date-fns';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import {
   createLeaveApproval,
   getApprovalProfile,
   updateApprovalProfile,
} from '@/services/approval.service';
import { getLeaveSickCount } from '@/services/attendance.service';
import type { LeaveRequestFormData } from '../types';

const DATE_FORMAT = 'yyyy-MM-dd';

const INITIAL_FORM: LeaveRequestFormData = {
   birthDate: '',
   startDate: '',
   endDate: '',
};

function isCompleteDate(value: string) {
   return value.length === 10 && isValid(parse(value, DATE_FORMAT, new Date()));
}

export function useLeaveRequestForm() {
   const [form, setForm] = useState<LeaveRequestFormData>(INITIAL_FORM);
   const [hasSignature, setHasSignature] = useState(false);
   const [isConfirmOpen, setIsConfirmOpen] = useState(false);
   const isSubmittingRef = useRef(false);
   const [isSubmitting, setIsSubmitting] = useState(false);

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

   const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
   const [isLoadingProfile, setIsLoadingProfile] = useState(true);
   const [hasProfileError, setHasProfileError] = useState(false);

   useEffect(() => {
      let isMounted = true;

      getApprovalProfile()
         .then((data) => {
            if (!isMounted) return;
            setPhoneNumber(data.phoneNumber);
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

   // 두 날짜가 모두 완전한 값일 때만 순서를 비교
   const hasDateOrderError =
      isCompleteDate(form.startDate) &&
      isCompleteDate(form.endDate) &&
      form.startDate > form.endDate;

   const hasFutureBirthDateError =
      isCompleteDate(form.birthDate) && form.birthDate > format(new Date(), DATE_FORMAT);

   const isFilled =
      isCompleteDate(form.birthDate) &&
      isCompleteDate(form.startDate) &&
      isCompleteDate(form.endDate) &&
      hasSignature &&
      !hasDateOrderError &&
      !hasFutureBirthDateError;

   const submit = () => {
      if (!isFilled) return;
      setIsConfirmOpen(true);
   };

   const confirmSubmit = async () => {
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;
      setIsSubmitting(true);

      try {
         await updateApprovalProfile({ birthDate: form.birthDate });
         await createLeaveApproval({ startDate: form.startDate, endDate: form.endDate });
         toast.success('휴가 결재 서류를 신청했습니다.');
         setIsConfirmOpen(false);
         // 생년월일은 계정에 저장된 값이라 다음 신청을 위해 유지
         setForm((prev) => ({ ...prev, startDate: '', endDate: '' }));
      } catch (err) {
         toast.error(
            err instanceof ApiError
               ? err.message
               : '휴가 신청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
         );
      } finally {
         isSubmittingRef.current = false;
         setIsSubmitting(false);
      }
   };

   const cancelSubmit = () => setIsConfirmOpen(false);

   return {
      form,
      updateField,
      hasSignature,
      setHasSignature,
      isFilled,
      dateOrderError: hasDateOrderError,
      birthDateError: hasFutureBirthDateError,
      isConfirmOpen,
      isSubmitting,
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
