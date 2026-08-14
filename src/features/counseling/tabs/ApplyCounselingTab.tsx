'use client';

import { CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { ROLE_LABELS } from '@/services/auth.service';
import CounselingCalendar from '../components/CounselingCalendar';
import CounselorList from '../components/CounselorList';
import AvailableTimeSlots from '../components/AvailableTimeSlots';
import { useApplyCounseling } from '../hooks/useApplyCounseling';

// 훈련생 "상담 신청" 탭
// 운영진 선택 → 달력에서 상담 가능일 선택 → 가능 시간 선택 → 주제·내용 입력 → 신청하기(확인 모달) → 신청
export default function ApplyCounselingTab() {
   const {
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
   } = useApplyCounseling();

   if (isLoadingCounselors) {
      return <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>;
   }

   if (counselors.length === 0) {
      return (
         <p className="py-16 text-center text-sm text-gray-400">
            현재 상담 가능한 운영진이 없습니다.
         </p>
      );
   }

   const selectedCounselor = counselors.find(
      (counselor) => counselor.counselorId === selectedCounselorId,
   );

   return (
      <div>
         <CounselorList
            counselors={counselors}
            selectedCounselorId={selectedCounselorId}
            onSelect={selectCounselor}
         />

         <div className="mt-3 grid grid-cols-[4.5fr_5.5fr] items-start gap-6">
            <CounselingCalendar
               selectedDate={selectedDate}
               onSelectDate={selectDate}
               configuredDates={availableDates}
               onMonthChange={setViewMonth}
            />

            <div className="flex flex-col gap-3">
               <div className="rounded-sm border border-gray-200 bg-white px-6 py-4">
                  <h3 className="flex items-center gap-1 text-[15px] font-semibold text-gray-900">
                     시간 선택<span className="font-bold text-[16px] text-brand-gold">*</span>
                  </h3>
                  <div className="mt-2">
                     {!selectedDate ? (
                        <div className="flex min-h-35 flex-col items-center justify-center gap-2 text-sm text-gray-400">
                           <CalendarDays size={28} className="text-gray-300" />
                           날짜를 먼저 선택해주세요
                        </div>
                     ) : isLoadingTimes ? (
                        <p className="py-15 text-center text-sm text-gray-400">불러오는 중...</p>
                     ) : (
                        <AvailableTimeSlots
                           times={availableTimes}
                           selectedTime={selectedTime}
                           onSelect={setSelectedTime}
                        />
                     )}
                  </div>
               </div>

               <div className="rounded-sm border border-gray-200 bg-white px-6 py-4">
                  <label
                     htmlFor="counseling-subject"
                     className="flex items-center gap-1 text-[15px] font-semibold text-gray-900"
                  >
                     상담 주제<span className="font-bold text-[16px] text-brand-gold">*</span>
                  </label>
                  <input
                     id="counseling-subject"
                     value={subject}
                     onChange={(event) => setSubject(event.target.value)}
                     placeholder="상담 주제를 입력해주세요."
                     className="mt-1 w-full rounded-xs border border-[#E5E7EB] px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-green"
                  />

                  <label
                     htmlFor="counseling-content"
                     className="mt-3 flex items-center gap-1 text-[15px] font-semibold text-gray-900"
                  >
                     상담 요청 내용<span className="font-bold text-[16px] text-brand-gold">*</span>
                  </label>
                  <textarea
                     id="counseling-content"
                     value={content}
                     onChange={(event) => setContent(event.target.value)}
                     placeholder="상담 요청 내용을 입력해주세요."
                     rows={5}
                     className="mt-1 w-full resize-none rounded-xs border border-[#E5E7EB] px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-green"
                  />
               </div>

               <button
                  type="button"
                  onClick={openConfirm}
                  disabled={!canSubmit}
                  className={`w-full rounded-sm py-3 text-sm font-semibold transition-colors ${
                     canSubmit
                        ? 'cursor-pointer bg-brand-green text-white hover:bg-[#4D655A]'
                        : 'cursor-not-allowed bg-[#E5E7EB] text-[#9CA3AF]'
                  }`}
               >
                  신청하기
               </button>
            </div>
         </div>

         <ConfirmModal
            open={isConfirmOpen}
            title="상담을 신청하시겠습니까?"
            description={
               selectedCounselor && selectedDate && selectedTime
                  ? `${selectedCounselor.name}(${ROLE_LABELS[selectedCounselor.role]})에게 ${format(selectedDate, 'yyyy-MM-dd')}\n ${selectedTime} 상담을 신청합니다.`
                  : undefined
            }
            confirmLabel={isSubmitting ? '신청 중' : '확인'}
            busy={isSubmitting}
            onConfirm={confirmSubmit}
            onClose={closeConfirm}
         />
      </div>
   );
}
