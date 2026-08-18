'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import {
   createConsultation,
   getAvailableTimes,
   getCounselorAvailableDates,
   getCounselors,
   type AvailableTimeSlot,
} from '@/services/counseling.service';

const DATE_KEY_FORMAT = 'yyyy-MM-dd';
const MONTH_KEY_FORMAT = 'yyyy-MM';

function getApiErrorMessage(err: unknown, fallback: string) {
   return err instanceof ApiError ? err.message : fallback;
}

// 훈련생 "상담 신청" 탭
// 운영진 선택 → 그 달의 상담 가능일 조회 → 날짜 선택 → 가능 시간 조회 → 주제·내용 입력 → [신청하기] → 확인 모달 → 신청
export function useApplyCounseling() {
   // useStaffCounselingHistory와 같은 queryKey를 써서 캐시를 공유한다
   const {
      data: counselors = [],
      isLoading: isLoadingCounselors,
      error: counselorsError,
   } = useQuery({
      queryKey: ['counselors'],
      queryFn: getCounselors,
   });

   useEffect(() => {
      if (counselorsError) {
         toast.error(getApiErrorMessage(counselorsError, '상담 가능 운영진 목록을 불러오지 못했습니다.'));
      }
   }, [counselorsError]);

   const [selectedCounselorId, setSelectedCounselorId] = useState<number | null>(null);
   // 운영진 목록이 도착하면 첫 번째를 기본 선택한다 - 한 번만 시딩한다
   const [hasSeededCounselor, setHasSeededCounselor] = useState(false);
   if (!hasSeededCounselor && counselors.length > 0) {
      setHasSeededCounselor(true);
      setSelectedCounselorId(counselors[0].counselorId);
   }

   const [viewMonth, setViewMonth] = useState<Date | null>(null);
   const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());

   const [selectedDate, setSelectedDate] = useState<Date | null>(null);
   const [availableTimes, setAvailableTimes] = useState<AvailableTimeSlot[]>([]);
   const [isLoadingTimes, setIsLoadingTimes] = useState(false);
   const [selectedTime, setSelectedTime] = useState<string | null>(null);

   const [subject, setSubject] = useState('');
   const [content, setContent] = useState('');

   const [isConfirmOpen, setIsConfirmOpen] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);
   
   const isSubmittingRef = useRef(false);

   const selectionGenerationRef = useRef(0);

   // 운영진 또는 보고 있는 달이 바뀌면 그 달의 상담 가능일을 다시 조회
   useEffect(() => {
      if (selectedCounselorId === null || !viewMonth) return;
      let isMounted = true;

      getCounselorAvailableDates(selectedCounselorId, format(viewMonth, MONTH_KEY_FORMAT))
         .then((dates) => {
            if (isMounted) setAvailableDates(new Set(dates));
         })
         .catch((err) => {
            if (!isMounted) return;
            toast.error(getApiErrorMessage(err, '상담 가능일을 불러오지 못했습니다.'));
         });

      return () => {
         isMounted = false;
      };
   }, [selectedCounselorId, viewMonth]);

   useEffect(() => {
      if (selectedCounselorId === null || !selectedDate) return;
      let isMounted = true;
      const requestGeneration = selectionGenerationRef.current;
      const isStillCurrent = () =>
         isMounted && selectionGenerationRef.current === requestGeneration;

      getAvailableTimes(selectedCounselorId, format(selectedDate, DATE_KEY_FORMAT))
         .then((times) => {
            if (isStillCurrent()) setAvailableTimes(times);
         })
         .catch((err) => {
            if (!isStillCurrent()) return;
            toast.error(getApiErrorMessage(err, '가능한 시간을 불러오지 못했습니다.'));
         })
         .finally(() => {
            if (isStillCurrent()) setIsLoadingTimes(false);
         });

      return () => {
         isMounted = false;
      };
   }, [selectedCounselorId, selectedDate]);

   const selectCounselor = (counselorId: number) => {
      if (counselorId === selectedCounselorId) return;
      selectionGenerationRef.current += 1;
      setSelectedCounselorId(counselorId);
      setSelectedDate(null);
      setSelectedTime(null);
      setAvailableTimes([]);
   };

   const selectDate = (date: Date) => {
      selectionGenerationRef.current += 1;
      setSelectedDate(date);
      setSelectedTime(null);
      setAvailableTimes([]);
      setIsLoadingTimes(true);
   };

   const canSubmit =
      selectedCounselorId !== null &&
      selectedDate !== null &&
      selectedTime !== null &&
      subject.trim().length > 0 &&
      content.trim().length > 0;

   const openConfirm = () => {
      if (!canSubmit) return;
      setIsConfirmOpen(true);
   };

   const closeConfirm = () => {
      if (isSubmitting) return;
      setIsConfirmOpen(false);
   };

   const refetchAvailableTimes = async () => {
      if (selectedCounselorId === null || !selectedDate) return;
      const requestCounselorId = selectedCounselorId;
      const requestDateKey = format(selectedDate, DATE_KEY_FORMAT);
      const requestGeneration = selectionGenerationRef.current;
      const isStillCurrent = () => selectionGenerationRef.current === requestGeneration;

      setIsLoadingTimes(true);
      setSelectedTime(null);
      try {
         const times = await getAvailableTimes(requestCounselorId, requestDateKey);
         if (!isStillCurrent()) return;
         setAvailableTimes(times);
      } catch (err) {
         if (!isStillCurrent()) return;
         toast.error(getApiErrorMessage(err, '가능한 시간을 불러오지 못했습니다.'));
      } finally {
         if (isStillCurrent()) setIsLoadingTimes(false);
      }
   };

   const confirmSubmit = async () => {
      if (!canSubmit || isSubmittingRef.current) return;
      if (selectedCounselorId === null || !selectedDate || !selectedTime) return;

      isSubmittingRef.current = true;
      setIsSubmitting(true);
      try {
         await createConsultation({
            counselorId: selectedCounselorId,
            scheduledAt: `${format(selectedDate, DATE_KEY_FORMAT)}T${selectedTime}:00`,
            topic: subject.trim(),
            content: content.trim(),
         });

         toast.success('상담 신청이 완료되었습니다.');
         setIsConfirmOpen(false);
         setSelectedDate(null);
         setSelectedTime(null);
         setAvailableTimes([]);
         setSubject('');
         setContent('');
      } catch (err) {
         setIsConfirmOpen(false);
         if (err instanceof ApiError && err.code === 'CONSULTATION_002') {
            toast.error('이미 예약된 시간입니다. 다른 시간을 선택해주세요.');
            refetchAvailableTimes();
         } else if (err instanceof ApiError && err.code === 'CONSULTATION_005') {
            toast.error('등록되지 않은 상담 가능 시간입니다. 다시 선택해주세요.');
            refetchAvailableTimes();
         } else if (
            err instanceof ApiError &&
            err.status === 400 &&
            Object.keys(err.errors).length > 0
         ) {
            toast.error(err.errors.topic ?? err.errors.content ?? err.message);
         } else {
            toast.error(
               getApiErrorMessage(
                  err,
                  '상담 신청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
               ),
            );
         }
      } finally {
         isSubmittingRef.current = false;
         setIsSubmitting(false);
      }
   };

   return {
      counselors,
      isLoadingCounselors,
      selectedCounselorId,
      selectCounselor,
      setViewMonth,
      availableDates,
      selectedDate,
      selectDate,
      availableTimes,
      isLoadingTimes,
      selectedTime,
      setSelectedTime,
      subject,
      setSubject,
      content,
      setContent,
      canSubmit,
      isConfirmOpen,
      openConfirm,
      closeConfirm,
      isSubmitting,
      confirmSubmit,
   };
}
