'use client';

import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import {
   getMyAvailableDates,
   getMyAvailableTimes,
   saveMyAvailableTimes,
   type AvailableTimeSlot,
} from '@/services/counseling.service';
import { ALL_TIME_SLOTS } from '../constants';
import type { CounselingTimeSlot } from '../types';

const DATE_KEY_FORMAT = 'yyyy-MM-dd';
const MONTH_KEY_FORMAT = 'yyyy-MM';

function getApiErrorMessage(err: unknown, fallback: string) {
   return err instanceof ApiError ? err.message : fallback;
}

function buildSlots(times: AvailableTimeSlot[]): CounselingTimeSlot[] {
   const openTimes = new Map(times.map((slot) => [slot.time, slot.isReserved]));
   return ALL_TIME_SLOTS.map((time) => ({
      time,
      isOpen: openTimes.has(time),
      isBooked: openTimes.get(time) ?? false,
   }));
}

function areSetsEqual(a: Set<string>, b: Set<string>) {
   if (a.size !== b.size) return false;
   for (const value of a) {
      if (!b.has(value)) return false;
   }
   return true;
}

export function useAvailabilityRegister() {
   const [viewMonth, setViewMonth] = useState<Date | null>(null);
   const [configuredDates, setConfiguredDates] = useState<Set<string>>(new Set());

   const [selectedDate, setSelectedDate] = useState<Date | null>(null);
   const [slots, setSlots] = useState<CounselingTimeSlot[]>([]);
   const [originalOpenTimes, setOriginalOpenTimes] = useState<Set<string>>(new Set());
   const [isLoadingTimes, setIsLoadingTimes] = useState(false);
   const [isSaving, setIsSaving] = useState(false);
   const isSavingRef = useRef(false);
   const selectionGenerationRef = useRef(0);

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
            setOriginalOpenTimes(new Set(times.map((slot) => slot.time)));
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
      selectionGenerationRef.current += 1;
      setSelectedDate(date);
      setSlots([]);
      setOriginalOpenTimes(new Set());
      setIsLoadingTimes(true);
   };

   // 예약된 슬롯은 토글 자체가 막힘
   const toggleSlot = (time: string) => {
      setSlots((prev) =>
         prev.map((slot) =>
            slot.time === time && !slot.isBooked ? { ...slot, isOpen: !slot.isOpen } : slot,
         ),
      );
   };

   const currentOpenTimes = new Set(slots.filter((slot) => slot.isOpen).map((slot) => slot.time));
   // 불러온 시점과 달라진 게 있을 때만 저장 가능
   const isDirty = !areSetsEqual(currentOpenTimes, originalOpenTimes);
   const canSave = Boolean(selectedDate) && isDirty && !isSaving;

   const refetchTimes = async () => {
      if (!selectedDate) return;
      const requestGeneration = selectionGenerationRef.current;
      const isStillCurrent = () => selectionGenerationRef.current === requestGeneration;

      setIsLoadingTimes(true);
      try {
         const times = await getMyAvailableTimes(format(selectedDate, DATE_KEY_FORMAT));
         if (!isStillCurrent()) return;
         setSlots(buildSlots(times));
         setOriginalOpenTimes(new Set(times.map((slot) => slot.time)));
      } catch (err) {
         if (!isStillCurrent()) return;
         toast.error(getApiErrorMessage(err, '상담 가능 시간을 불러오지 못했습니다.'));
      } finally {
         if (isStillCurrent()) setIsLoadingTimes(false);
      }
   };

   const handleSave = async () => {
      if (!selectedDate || !canSave) return;
      if (isSavingRef.current) return;
      isSavingRef.current = true;

      const dateKey = format(selectedDate, DATE_KEY_FORMAT);
      const savedTimes = currentOpenTimes;
      const requestGeneration = selectionGenerationRef.current;
      const isStillCurrent = () => selectionGenerationRef.current === requestGeneration;

      setIsSaving(true);
      try {
         await saveMyAvailableTimes({ date: dateKey, times: Array.from(savedTimes) });
         setConfiguredDates((prev) => {
            const next = new Set(prev);
            if (savedTimes.size > 0) {
               next.add(dateKey);
            } else {
               next.delete(dateKey);
            }
            return next;
         });
         
         if (isStillCurrent()) setOriginalOpenTimes(new Set(savedTimes));
         toast.success('상담 가능 시간이 저장되었습니다.');
      } catch (err) {
         if (err instanceof ApiError && err.code === 'CONSULTATION_004') {
            toast.error('이미 예약이 잡힌 시간은 가능 시간에서 해제할 수 없습니다.');
            if (isStillCurrent()) refetchTimes();
         } else {
            toast.error(
               getApiErrorMessage(
                  err,
                  '상담 가능 시간 저장에 실패했습니다. 잠시 후 다시 시도해주세요.',
               ),
            );
         }
      } finally {
         isSavingRef.current = false;
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
