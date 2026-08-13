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

// 모달 안에서 편집 가능한 후보 1건 - eventType/시각은 값이 없을 수 있어 셀렉트·인풋과 맞는
// 문자열 형태(''/'HH:mm')로 들고 있다가, 제출 시점에 API가 원하는 형태로 다시 바꾼다
export type EditableScheduleCandidate = {
   title: string;
   eventType: NoticeEventType | '';
   startDate: string;
   startTime: string; // 'HH:mm' 또는 ''
   endDate: string;
   endTime: string;
   location: string;
   // [이 일정 포함] 체크 여부 - 기본은 꺼짐(AI가 뽑아준 걸 그대로 다 등록하면 안 되니 매번 확인받음)
   included: boolean;
};

// 백엔드가 초 단위까지 내려주는 HH:mm:ss를 <input type="time">이 쓰는 HH:mm으로 자른다
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

// 공지 상세의 "AI 일정 추출" 노란 박스 + 모달 상태 전체를 관리하는 훅.
// noticeId, onRegistered(등록 성공 시 상위에 aiCalendarRegistered=true를 반영시키는 콜백)를 받는다
export function useAiScheduleExtraction(noticeId: number, onRegistered: () => void) {
   const [isExtracting, setIsExtracting] = useState(false);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [candidates, setCandidates] = useState<EditableScheduleCandidate[]>([]);
   const [currentIndex, setCurrentIndex] = useState(0);
   const [isSubmitting, setIsSubmitting] = useState(false);

   // 노란 박스의 [등록하기] - AI 호출이라 몇 초 걸리므로 진행 중엔 다시 누를 수 없게 막는다
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

   // 제출 대상 = [이 일정 포함]을 켰고 유형도 고른 후보만(유형 미선택 후보는 보내면 400이라 제외)
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
         // 이미 등록된 공지(1회성이라 되돌릴 수 없음) - 실제로는 이미 등록된 상태이므로 상위의
         // aiCalendarRegistered도 같이 동기화해서 노란 박스가 사라지게 한다(새로고침 안내만 하고
         // 끝내면 화면과 서버 상태가 계속 어긋난 채로 남는다)
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
