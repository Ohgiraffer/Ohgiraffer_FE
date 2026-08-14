'use client';

import { useId } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/date-picker';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/shadcn/select';
import { NOTICE_EVENT_TYPE_OPTIONS } from '../../types';
import type { EditableScheduleCandidate } from '../../hooks/useAiScheduleExtraction';

type Props = {
   candidates: EditableScheduleCandidate[];
   currentIndex: number;
   onPrev: () => void;
   onNext: () => void;
   onUpdate: <K extends keyof EditableScheduleCandidate>(
      index: number,
      field: K,
      value: EditableScheduleCandidate[K],
   ) => void;
   selectedCount: number;
   isSubmitting: boolean;
   onSubmit: () => void;
   onClose: () => void;
};

export default function AiScheduleExtractionModal({
   candidates,
   currentIndex,
   onPrev,
   onNext,
   onUpdate,
   selectedCount,
   isSubmitting,
   onSubmit,
   onClose,
}: Props) {
   const idPrefix = useId();
   const titleId = `${idPrefix}-title`;
   const eventTypeId = `${idPrefix}-event-type`;
   const eventTypeWarningId = `${idPrefix}-event-type-warning`;
   const startDateId = `${idPrefix}-start-date`;
   const startTimeId = `${idPrefix}-start-time`;
   const endDateId = `${idPrefix}-end-date`;
   const endTimeId = `${idPrefix}-end-time`;
   const locationId = `${idPrefix}-location`;

   const candidate = candidates[currentIndex];
   if (!candidate) return null;

   const total = candidates.length;
   const showTypeWarning = candidate.eventType === '';

   return (
      <Modal
         onClose={onClose}
         ariaLabel="AI 추출 일정"
         panelClassName="w-full max-w-xl"
         closeOnBackdropClick={false}
      >
         <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-lg font-bold text-gray-900">
               <Sparkles size={18} className="text-brand-gold" />
               AI 추출 일정
            </h2>
            <button
               type="button"
               onClick={onClose}
               aria-label="닫기"
               className="cursor-pointer rounded-sm p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-700"
            >
               <X size={20} />
            </button>
         </div>

         <p className="mt-2 rounded-xs border border-[#F3DFA0] bg-[#FFF9EC] px-4 py-2.5 text-sm text-gray-700">
            ⚠ 공지 수정·삭제 시 캘린더에 자동 반영되지 않습니다
         </p>

         <div className="mt-3 flex items-center gap-3">
            <button
               type="button"
               onClick={onPrev}
               disabled={currentIndex === 0}
               aria-label="이전 후보"
               className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-sm text-gray-400 hover:bg-gray-50 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
            >
               <ChevronLeft size={20} />
            </button>

            <div className="min-w-0 flex-1 rounded-sm border border-[#E5E7EB] px-5 py-4">
               <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">
                     {currentIndex + 1} / {total}
                  </span>
                  <label className="flex cursor-pointer items-center gap-1 text-[13px] text-gray-700">
                     <input
                        type="checkbox"
                        checked={candidate.included}
                        onChange={(e) => onUpdate(currentIndex, 'included', e.target.checked)}
                        className="h-4 w-4 cursor-pointer rounded-xs accent-brand-green"
                     />
                     이 일정 포함
                  </label>
               </div>

               <div className="mt-3">
                  <label htmlFor={titleId} className="text-[14px] font-semibold text-gray-900">
                     일정명 <span className="font-bold text-[16px] text-brand-gold">*</span>
                  </label>
                  <input
                     id={titleId}
                     type="text"
                     value={candidate.title}
                     onChange={(e) => onUpdate(currentIndex, 'title', e.target.value)}
                     className="mt-1 w-full rounded-xs border border-[#E5E7EB] px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-green"
                  />
               </div>

               <div className="mt-3">
                  <label htmlFor={eventTypeId} className="text-[14px] font-semibold text-gray-900">
                     유형 <span className="font-bold text-[16px] text-brand-gold">*</span>
                  </label>
                  <Select
                     value={candidate.eventType}
                     onValueChange={(value) =>
                        value &&
                        onUpdate(currentIndex, 'eventType', value as typeof candidate.eventType)
                     }
                  >
                     <SelectTrigger
                        id={eventTypeId}
                        aria-describedby={showTypeWarning ? eventTypeWarningId : undefined}
                        className={`mt-1 h-10 w-full rounded-xs bg-white ${
                           showTypeWarning ? 'border-brand-red' : 'border-[#E5E7EB]'
                        }`}
                     >
                        <SelectValue placeholder="유형을 선택해주세요">
                           {(value: string | null) =>
                              value
                                 ? NOTICE_EVENT_TYPE_OPTIONS.find((o) => o.value === value)?.label
                                 : '유형을 선택해주세요'
                           }
                        </SelectValue>
                     </SelectTrigger>
                     <SelectContent alignItemWithTrigger={false} align="start" sideOffset={4}>
                        {NOTICE_EVENT_TYPE_OPTIONS.map((option) => (
                           <SelectItem
                              key={option.value}
                              value={option.value}
                              className="cursor-pointer"
                           >
                              {option.label}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
                  {showTypeWarning && (
                     <p id={eventTypeWarningId} className="mt-1.5 text-xs text-brand-red">
                        ⚠ 공지사항 유형을 선택해야 일정 등록이 가능합니다.
                     </p>
                  )}
               </div>

               <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                     <label
                        htmlFor={startDateId}
                        className="text-[14px] font-semibold text-gray-900"
                     >
                        시작일 <span className="font-bold text-[16px] text-brand-gold">*</span>
                     </label>
                     <DatePicker
                        id={startDateId}
                        value={candidate.startDate}
                        onChange={(value) => onUpdate(currentIndex, 'startDate', value)}
                        className="mt-1"
                     />
                  </div>
                  <div>
                     <label
                        htmlFor={startTimeId}
                        className="text-[14px] font-semibold text-gray-900"
                     >
                        시작 시각{' '}
                        <span className="text-[13px] font-medium text-gray-400">(선택)</span>
                     </label>
                     <input
                        id={startTimeId}
                        type="time"
                        value={candidate.startTime}
                        onChange={(e) => onUpdate(currentIndex, 'startTime', e.target.value)}
                        className="mt-1 w-full rounded-xs border border-[#E5E7EB] px-4 h-10.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-green"
                     />
                  </div>
               </div>

               <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                     <label htmlFor={endDateId} className="text-[14px] font-semibold text-gray-900">
                        종료일 <span className="font-bold text-[16px] text-brand-gold">*</span>
                     </label>
                     <DatePicker
                        id={endDateId}
                        value={candidate.endDate}
                        onChange={(value) => onUpdate(currentIndex, 'endDate', value)}
                        className="mt-1"
                     />
                  </div>
                  <div>
                     <label htmlFor={endTimeId} className="text-[14px] font-semibold text-gray-900">
                        종료 시각{' '}
                        <span className="text-[13px] font-medium text-gray-400">(선택)</span>
                     </label>
                     <input
                        id={endTimeId}
                        type="time"
                        value={candidate.endTime}
                        onChange={(e) => onUpdate(currentIndex, 'endTime', e.target.value)}
                        className="mt-1 w-full rounded-xs border border-[#E5E7EB] px-4 h-10.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-green"
                     />
                  </div>
               </div>

               <div className="mt-3">
                  <label htmlFor={locationId} className="text-[14px] font-semibold text-gray-900">
                     장소 <span className="text-[13px] font-medium text-[#9CA3AF]">(선택)</span>
                  </label>
                  <input
                     id={locationId}
                     type="text"
                     value={candidate.location}
                     onChange={(e) => onUpdate(currentIndex, 'location', e.target.value)}
                     placeholder="장소를 입력해주세요"
                     className="mt-1 w-full rounded-xs border border-[#E5E7EB] px-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-green"
                  />
               </div>
            </div>

            <button
               type="button"
               onClick={onNext}
               disabled={currentIndex === total - 1}
               aria-label="다음 후보"
               className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-sm text-gray-400 hover:bg-gray-50 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
            >
               <ChevronRight size={20} />
            </button>
         </div>

         <p className="mt-2 text-center text-sm text-gray-500">
            {selectedCount}개 선택됨 · 유형 미선택 후보는 제외됩니다
         </p>

         <button
            type="button"
            disabled={selectedCount === 0 || isSubmitting}
            onClick={onSubmit}
            className={`mt-2 w-full cursor-pointer rounded-xs py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
               selectedCount === 0 || isSubmitting
                  ? 'bg-[#E5E7EB] text-[#9CA3AF]'
                  : 'bg-brand-green text-white hover:bg-[#4D655A]'
            }`}
         >
            {isSubmitting ? '등록 중...' : '선택 일정 캘린더에 등록'}
         </button>
      </Modal>
   );
}
