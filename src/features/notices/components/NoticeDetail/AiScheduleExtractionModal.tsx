'use client';

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

// 공지에서 AI로 추출한 일정 후보를 확인·수정하고 캘린더에 등록할 후보를 고르는 모달.
// 후보가 여러 개면 1/N 페이징으로 하나씩 보여준다(전체 목록을 한 화면에 다 안 그림)
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
   const candidate = candidates[currentIndex];
   if (!candidate) return null;

   const total = candidates.length;
   const showTypeWarning = candidate.eventType === '';

   return (
      <Modal
         onClose={onClose}
         ariaLabel="AI 추출 일정"
         panelClassName="w-full max-w-2xl"
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

         <p className="mt-3 rounded-xs border border-[#F3DFA0] bg-[#FFF9EC] px-4 py-2.5 text-sm text-gray-700">
            ⚠ 공지 수정·삭제 시 캘린더에 자동 반영되지 않습니다
         </p>

         <div className="mt-4 flex items-center gap-3">
            <button
               type="button"
               onClick={onPrev}
               disabled={currentIndex === 0}
               aria-label="이전 후보"
               className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-sm text-gray-400 hover:bg-gray-50 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
            >
               <ChevronLeft size={20} />
            </button>

            <div className="min-w-0 flex-1 rounded-sm border border-[#E5E7EB] p-5">
               <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">
                     {currentIndex + 1} / {total}
                  </span>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                     <input
                        type="checkbox"
                        checked={candidate.included}
                        onChange={(e) => onUpdate(currentIndex, 'included', e.target.checked)}
                        className="h-4 w-4 cursor-pointer rounded-xs accent-brand-green"
                     />
                     이 일정 포함
                  </label>
               </div>

               <div className="mt-4">
                  <label className="text-sm font-semibold text-gray-900">
                     일정명 <span className="font-bold text-brand-gold">*</span>
                  </label>
                  <input
                     type="text"
                     value={candidate.title}
                     onChange={(e) => onUpdate(currentIndex, 'title', e.target.value)}
                     className="mt-2 w-full rounded-xs border border-[#E5E7EB] px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-green"
                  />
               </div>

               <div className="mt-4">
                  <label className="text-sm font-semibold text-gray-900">
                     유형 <span className="font-bold text-brand-gold">*</span>
                  </label>
                  <Select
                     value={candidate.eventType}
                     onValueChange={(value) =>
                        value && onUpdate(currentIndex, 'eventType', value as typeof candidate.eventType)
                     }
                  >
                     <SelectTrigger
                        className={`mt-2 h-10 w-full rounded-xs bg-white ${
                           showTypeWarning ? 'border-brand-red' : 'border-[#E5E7EB]'
                        }`}
                     >
                        {/* base-ui의 SelectValue는 children이 함수면 placeholder를 무시하고 그
                            함수 반환값만 쓴다 - 값이 없을 때 문구도, 값이 있을 때 라벨도 직접
                            계산해야 함(내부 등록 기반 자동 라벨 해석은 드롭다운을 열기 전엔 못 믿음) */}
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
                     <p className="mt-1.5 text-xs text-brand-red">
                        ⚠ 공지사항 유형을 선택해야 일정 등록이 가능합니다.
                     </p>
                  )}
               </div>

               <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-sm font-semibold text-gray-900">
                        시작일 <span className="font-bold text-brand-gold">*</span>
                     </label>
                     <DatePicker
                        value={candidate.startDate}
                        onChange={(value) => onUpdate(currentIndex, 'startDate', value)}
                        className="mt-2"
                     />
                  </div>
                  <div>
                     <label className="text-sm font-semibold text-gray-900">
                        시작 시각 <span className="text-gray-400">(선택)</span>
                     </label>
                     <input
                        type="time"
                        value={candidate.startTime}
                        onChange={(e) => onUpdate(currentIndex, 'startTime', e.target.value)}
                        className="mt-2 w-full rounded-xs border border-[#E5E7EB] px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-green"
                     />
                  </div>
               </div>

               <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-sm font-semibold text-gray-900">
                        종료일 <span className="font-bold text-brand-gold">*</span>
                     </label>
                     <DatePicker
                        value={candidate.endDate}
                        onChange={(value) => onUpdate(currentIndex, 'endDate', value)}
                        className="mt-2"
                     />
                  </div>
                  <div>
                     <label className="text-sm font-semibold text-gray-900">
                        종료 시각 <span className="text-gray-400">(선택)</span>
                     </label>
                     <input
                        type="time"
                        value={candidate.endTime}
                        onChange={(e) => onUpdate(currentIndex, 'endTime', e.target.value)}
                        className="mt-2 w-full rounded-xs border border-[#E5E7EB] px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-green"
                     />
                  </div>
               </div>

               <div className="mt-4">
                  <label className="text-sm font-semibold text-gray-900">
                     장소 <span className="text-gray-400">(선택)</span>
                  </label>
                  <input
                     type="text"
                     value={candidate.location}
                     onChange={(e) => onUpdate(currentIndex, 'location', e.target.value)}
                     placeholder="장소를 입력해주세요"
                     className="mt-2 w-full rounded-xs border border-[#E5E7EB] px-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-green"
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

         <p className="mt-4 text-center text-sm text-gray-500">
            {selectedCount}개 선택됨 · 유형 미선택 후보는 제외됩니다
         </p>

         <button
            type="button"
            disabled={selectedCount === 0 || isSubmitting}
            onClick={onSubmit}
            className={`mt-3 w-full cursor-pointer rounded-xs py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
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
