'use client';

import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import {
   createConsultation,
   getAvailableTimes,
   getCounselorAvailableDates,
   getCounselors,
   type AvailableTimeSlot,
   type Counselor,
} from '@/services/counseling.service';

const DATE_KEY_FORMAT = 'yyyy-MM-dd';
const MONTH_KEY_FORMAT = 'yyyy-MM';

function getApiErrorMessage(err: unknown, fallback: string) {
   return err instanceof ApiError ? err.message : fallback;
}

// 훈련생 "상담 신청" 탭 상태 - 운영진 선택 → 그 달의 상담 가능일 조회 → 날짜 선택 → 그 날짜의
// 가능 시간 조회 → 주제·내용 입력 → [신청하기] → 확인 모달 → 신청, 순서로 이어진다
export function useApplyCounseling() {
   const [counselors, setCounselors] = useState<Counselor[]>([]);
   const [isLoadingCounselors, setIsLoadingCounselors] = useState(true);
   const [selectedCounselorId, setSelectedCounselorId] = useState<number | null>(null);

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
   // 더블클릭으로 인한 중복 신청 방지 - state는 비동기라 클릭 시점에 바로 막아줄 동기 가드가 필요
   const isSubmittingRef = useRef(false);

   // refetchAvailableTimes는 useEffect 밖에서 수동으로 호출되는 비동기 함수라, 일반 조회 effect와
   // 달리 "그 사이에 선택이 바뀌었는지"를 스스로 판단할 방법이 없다(effect의 cleanup·isMounted
   // 패턴이 안 통함) - 항상 최신 선택값을 담아두는 ref를 별도로 두고, 응답이 왔을 때 그 시점의
   // 선택과 비교해서 이미 낡은 응답이면 버린다
   const latestSelectionRef = useRef({ counselorId: selectedCounselorId, dateKey: '' });
   useEffect(() => {
      latestSelectionRef.current = {
         counselorId: selectedCounselorId,
         dateKey: selectedDate ? format(selectedDate, DATE_KEY_FORMAT) : '',
      };
   }, [selectedCounselorId, selectedDate]);

   // 상담 가능 운영진 목록 최초 조회 - 첫 번째 운영진을 기본 선택해둔다
   useEffect(() => {
      let isMounted = true;

      getCounselors()
         .then((data) => {
            if (!isMounted) return;
            setCounselors(data);
            if (data.length > 0) setSelectedCounselorId(data[0].counselorId);
         })
         .catch((err) => {
            if (!isMounted) return;
            toast.error(getApiErrorMessage(err, '상담 가능 운영진 목록을 불러오지 못했습니다.'));
         })
         .finally(() => {
            if (isMounted) setIsLoadingCounselors(false);
         });

      return () => {
         isMounted = false;
      };
   }, []);

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

   // 날짜를 고르면 그 운영진의 그 날짜 가능 시간을 조회 - 날짜가 없으면(운영진 변경 등으로 초기화된
   // 경우) 아무것도 하지 않는다. availableTimes를 비우는 건 날짜를 비우는 시점(selectCounselor)에서 처리
   useEffect(() => {
      if (selectedCounselorId === null || !selectedDate) return;
      let isMounted = true;

      getAvailableTimes(selectedCounselorId, format(selectedDate, DATE_KEY_FORMAT))
         .then((times) => {
            if (isMounted) setAvailableTimes(times);
         })
         .catch((err) => {
            if (!isMounted) return;
            toast.error(getApiErrorMessage(err, '가능한 시간을 불러오지 못했습니다.'));
         })
         .finally(() => {
            if (isMounted) setIsLoadingTimes(false);
         });

      return () => {
         isMounted = false;
      };
   }, [selectedCounselorId, selectedDate]);

   const selectCounselor = (counselorId: number) => {
      if (counselorId === selectedCounselorId) return;
      setSelectedCounselorId(counselorId);
      setSelectedDate(null);
      setSelectedTime(null);
      setAvailableTimes([]);
   };

   const selectDate = (date: Date) => {
      setSelectedDate(date);
      setSelectedTime(null);
      // 이전 날짜의 시간 목록을 남겨두면, 새 날짜 조회가 실패했을 때(catch에서 availableTimes를
      // 안 건드림) 화면에 이전 날짜의 시간이 마치 새 날짜 것처럼 계속 보일 수 있다
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

   // 409(이미 예약됨)로 거절되면, 화면에 남아있는 목록이 이미 낡은 값이므로 다시 조회해서
   // 방금 신청 시도한 시간이 예약됨으로 바뀐 걸 보여준다. 방금 시도했던 시간 선택도 같이 풀어줘야
   // 한다 - 안 그러면 이미 예약된(다시 눌러도 disabled인) 시간이 여전히 "선택됨" 상태로 남아서,
   // 사용자가 그대로 다시 [신청하기]를 눌러 같은 409를 반복해서 받는 혼란스러운 루프가 생긴다
   const refetchAvailableTimes = async () => {
      if (selectedCounselorId === null || !selectedDate) return;
      const requestCounselorId = selectedCounselorId;
      const requestDateKey = format(selectedDate, DATE_KEY_FORMAT);
      const isStillCurrent = () =>
         latestSelectionRef.current.counselorId === requestCounselorId &&
         latestSelectionRef.current.dateKey === requestDateKey;

      setIsLoadingTimes(true);
      setSelectedTime(null);
      try {
         const times = await getAvailableTimes(requestCounselorId, requestDateKey);
         // 응답을 기다리는 사이 사용자가 다른 날짜/운영진을 선택했으면 이미 낡은 응답이다 - 그
         // 사이 새로 시작된 조회(effect)의 결과를 덮어쓰면 안 되므로 버린다
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
      // canSubmit이 true인 시점엔 항상 값이 있지만, 타입 좁히기를 위해 다시 한번 확인
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
