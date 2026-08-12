'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import {
   getMyAvailableDates,
   getMyAvailableTimes,
   saveMyAvailableTimes,
} from '@/services/counseling.service';
import { ALL_TIME_SLOTS } from '../constants';
import type { CounselingTimeSlot } from '../types';

const DATE_KEY_FORMAT = 'yyyy-MM-dd';
const MONTH_KEY_FORMAT = 'yyyy-MM';

function getApiErrorMessage(err: unknown, fallback: string) {
   return err instanceof ApiError ? err.message : fallback;
}

// 서버는 "열려있는 시간"만 내려주므로(닫힌 시간은 응답에 아예 없음), 09:00~19:00 전체 고정
// 슬롯과 합쳐서 화면에 뿌릴 21개짜리 목록을 만든다.
// /consultation/available-times/mine은 시간 문자열만 내려줄 뿐 예약 여부를 알려주지 않으므로
// isBooked는 항상 false로 두고, 이미 예약된 시간을 끄려는 시도는 저장 시 409(CONSULTATION_004)로만 막힌다
function buildSlots(times: string[]): CounselingTimeSlot[] {
   const openTimes = new Set(times);
   return ALL_TIME_SLOTS.map((time) => ({
      time,
      isOpen: openTimes.has(time),
      isBooked: false,
   }));
}

function areSetsEqual(a: Set<string>, b: Set<string>) {
   if (a.size !== b.size) return false;
   for (const value of a) {
      if (!b.has(value)) return false;
   }
   return true;
}

// 운영진 "가능 시간 등록" 탭 상태 - 달이 바뀌면 그 달의 설정된 날짜를 조회하고, 날짜를 고르면
// 그 날짜에 저장된 시간을 불러온다. 저장 버튼은 불러온 시점과 비교해 "수정이 있을 때만" 활성화된다
export function useAvailabilityRegister() {
   // 이미 가능 시간이 저장된 날짜 - 달력에 "설정됨"으로 표시됨
   const [viewMonth, setViewMonth] = useState<Date | null>(null);
   const [configuredDates, setConfiguredDates] = useState<Set<string>>(new Set());

   const [selectedDate, setSelectedDate] = useState<Date | null>(null);
   const [slots, setSlots] = useState<CounselingTimeSlot[]>([]);
   // 조회 직후의 "열린 시간" 스냅샷 - 여기서 값이 바뀌었는지를 기준으로 저장 버튼 활성화 여부를 결정한다
   const [originalOpenTimes, setOriginalOpenTimes] = useState<Set<string>>(new Set());
   const [isLoadingTimes, setIsLoadingTimes] = useState(false);
   const [isSaving, setIsSaving] = useState(false);

   // 보고 있는 달이 바뀌면 그 달의 설정된 날짜 목록을 다시 조회
   useEffect(() => {
      if (!viewMonth) return;
      let isMounted = true;

      getMyAvailableDates(format(viewMonth, MONTH_KEY_FORMAT))
         .then((dates) => {
            if (isMounted) setConfiguredDates(new Set(dates));
         })
         .catch((err) => {
            if (!isMounted) return;
            toast.error(getApiErrorMessage(err, '상담 가능일을 불러오지 못했습니다.'));
         });

      return () => {
         isMounted = false;
      };
   }, [viewMonth]);

   // 날짜를 고르면 그 날짜에 저장된 시간을 조회
   useEffect(() => {
      if (!selectedDate) return;
      let isMounted = true;

      getMyAvailableTimes(format(selectedDate, DATE_KEY_FORMAT))
         .then((times) => {
            if (!isMounted) return;
            setSlots(buildSlots(times));
            setOriginalOpenTimes(new Set(times));
         })
         .catch((err) => {
            if (!isMounted) return;
            toast.error(getApiErrorMessage(err, '상담 가능 시간을 불러오지 못했습니다.'));
         })
         .finally(() => {
            if (isMounted) setIsLoadingTimes(false);
         });

      return () => {
         isMounted = false;
      };
   }, [selectedDate]);

   const selectDate = (date: Date) => {
      setSelectedDate(date);
      setIsLoadingTimes(true);
   };

   // 예약된 슬롯은 토글 자체가 막힘 - 버튼에서도 disabled 처리하지만 여기서도 한 번 더 방어함
   const toggleSlot = (time: string) => {
      setSlots((prev) =>
         prev.map((slot) =>
            slot.time === time && !slot.isBooked ? { ...slot, isOpen: !slot.isOpen } : slot,
         ),
      );
   };

   const currentOpenTimes = new Set(slots.filter((slot) => slot.isOpen).map((slot) => slot.time));
   // 불러온 시점과 달라진 게 있을 때만 저장 가능(하나도 안 바꿨으면 저장할 필요가 없음)
   const isDirty = !areSetsEqual(currentOpenTimes, originalOpenTimes);
   const canSave = Boolean(selectedDate) && isDirty && !isSaving;

   // 서버 저장에 실패했을 때(예: 409로 거절) 화면을 다시 서버 상태로 맞춘다
   const refetchTimes = async () => {
      if (!selectedDate) return;
      setIsLoadingTimes(true);
      try {
         const times = await getMyAvailableTimes(format(selectedDate, DATE_KEY_FORMAT));
         setSlots(buildSlots(times));
         setOriginalOpenTimes(new Set(times));
      } catch (err) {
         toast.error(getApiErrorMessage(err, '상담 가능 시간을 불러오지 못했습니다.'));
      } finally {
         setIsLoadingTimes(false);
      }
   };

   const handleSave = async () => {
      if (!selectedDate || !canSave) return;
      const dateKey = format(selectedDate, DATE_KEY_FORMAT);
      setIsSaving(true);
      try {
         await saveMyAvailableTimes({ date: dateKey, times: Array.from(currentOpenTimes) });
         setOriginalOpenTimes(new Set(currentOpenTimes));
         setConfiguredDates((prev) => {
            const next = new Set(prev);
            if (currentOpenTimes.size > 0) {
               next.add(dateKey);
            } else {
               next.delete(dateKey);
            }
            return next;
         });
         toast.success('상담 가능 시간이 저장되었습니다.');
      } catch (err) {
         if (err instanceof ApiError && err.code === 'CONSULTATION_004') {
            toast.error('이미 예약이 잡힌 시간은 가능 시간에서 해제할 수 없습니다.');
            refetchTimes();
         } else {
            toast.error(
               getApiErrorMessage(
                  err,
                  '상담 가능 시간 저장에 실패했습니다. 잠시 후 다시 시도해주세요.',
               ),
            );
         }
      } finally {
         setIsSaving(false);
      }
   };

   return {
      setViewMonth,
      configuredDates,
      selectedDate,
      selectDate,
      slots,
      isLoadingTimes,
      toggleSlot,
      canSave,
      isSaving,
      handleSave,
   };
}
