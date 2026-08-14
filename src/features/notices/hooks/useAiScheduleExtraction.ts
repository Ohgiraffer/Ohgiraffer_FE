'use client';

import { useState } from 'react';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import {
   extractNoticeSchedules,
   registerNoticeCalendarEvents,
   type CalendarEventInput,
   type ExtractedScheduleCandidate,
   type NoticeEventType,
} from '@/services/notice.service';

export type EditableScheduleCandidate = {
   title: string;
   eventType: NoticeEventType | '';
   startDate: string;
   startTime: string; // 'HH:mm' 또는 ''
   endDate: string;
   endTime: string;
   location: string;
   included: boolean;
};

function toTimeInputValue(time: string | null) {
   return time ? time.slice(0, 5) : '';
}

function toEditableCandidate(candidate: ExtractedScheduleCandidate): EditableScheduleCandidate {
   return {
      title: candidate.title,
      eventType: candidate.eventType ?? '',
      startDate: candidate.startDate,
      startTime: toTimeInputValue(candidate.startTime),
      endDate: candidate.endDate,
      endTime: toTimeInputValue(candidate.endTime),
      location: candidate.location ?? '',
      included: false,
   };
}

// 공지 상세의 "AI 일정 추출" 박스 + 모달 상태 전체 관리 훅
export function useAiScheduleExtraction(noticeId: number, onRegistered: () => void) {
   const [isExtracting, setIsExtracting] = useState(false);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [candidates, setCandidates] = useState<EditableScheduleCandidate[]>([]);
   const [currentIndex, setCurrentIndex] = useState(0);
   const [isSubmitting, setIsSubmitting] = useState(false);

   const runExtraction = async () => {
      if (isExtracting) return;
      setIsExtracting(true);

      try {
         const result = await extractNoticeSchedules(noticeId);
         if (result.length === 0) {
            toast.warning('공지사항에서 추출된 일정이 없습니다.');
            return;
         }
         setCandidates(result.map(toEditableCandidate));
         setCurrentIndex(0);
         setIsModalOpen(true);
      } catch (err) {
         toast.error(
            err instanceof ApiError
               ? err.message
               : '일정 추출 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
         );
      } finally {
         setIsExtracting(false);
      }
   };

   const closeModal = () => {
      if (isSubmitting) return;
      setIsModalOpen(false);
   };

   const updateCandidate = <K extends keyof EditableScheduleCandidate>(
      index: number,
      field: K,
      value: EditableScheduleCandidate[K],
   ) => {
      setCandidates((prev) =>
         prev.map((candidate, i) => (i === index ? { ...candidate, [field]: value } : candidate)),
      );
   };

   const goToPrev = () => setCurrentIndex((i) => Math.max(0, i - 1));
   const goToNext = () => setCurrentIndex((i) => Math.min(candidates.length - 1, i + 1));

   const includedCandidates = candidates.filter((c) => c.included && c.eventType !== '');
   const selectedCount = includedCandidates.length;

   const confirmRegister = async () => {
      if (isSubmitting || selectedCount === 0) return;
      setIsSubmitting(true);

      try {
         const schedules: CalendarEventInput[] = includedCandidates.map((c) => ({
            title: c.title,
            eventType: c.eventType as NoticeEventType,
            startDate: c.startDate,
            startTime: c.startTime || null,
            endDate: c.endDate,
            endTime: c.endTime || null,
            location: c.location.trim() || null,
         }));
         await registerNoticeCalendarEvents(noticeId, schedules);
         toast.success('일정이 성공적으로 캘린더에 등록되었습니다.');
         setIsModalOpen(false);
         onRegistered();
      } catch (err) {
         if (err instanceof ApiError && err.code === 'NOTICE_013') {
            toast.error(err.message);
            setIsModalOpen(false);
            onRegistered();
            return;
         }
         toast.error(
            err instanceof ApiError
               ? err.message
               : '일정 등록 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
         );
      } finally {
         setIsSubmitting(false);
      }
   };

   return {
      isExtracting,
      runExtraction,
      isModalOpen,
      closeModal,
      candidates,
      currentIndex,
      goToPrev,
      goToNext,
      updateCandidate,
      selectedCount,
      isSubmitting,
      confirmRegister,
   };
}
