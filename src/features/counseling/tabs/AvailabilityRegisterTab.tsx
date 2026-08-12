'use client';

import { CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import CounselingCalendar from '../components/CounselingCalendar';
import TimeSlotGrid from '../components/TimeSlotGrid';
import { useAvailabilityRegister } from '../hooks/useAvailabilityRegister';

// 운영진 "가능 시간 등록" 탭 - 달력에서 날짜를 고르고, 그 날 09:00~19:00 중 상담을 열고 싶은
// 시간을 선택해서 저장한다. 불러온 시점과 달라진 게 있을 때만 저장 버튼이 활성화되고,
// 예약된 시간은 끌 수 없다
export default function AvailabilityRegisterTab() {
   const {
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
   } = useAvailabilityRegister();

   return (
      <div className="grid grid-cols-[4.5fr_5.5fr] items-start gap-6">
         <CounselingCalendar
            selectedDate={selectedDate}
            onSelectDate={selectDate}
            configuredDates={configuredDates}
            onMonthChange={setViewMonth}
         />

         <div className="flex flex-col gap-4">
            <div className="rounded-sm border border-gray-200 bg-white p-6">
               {!selectedDate ? (
                  <div className="flex min-h-52 flex-col items-center justify-center gap-2 text-sm text-gray-400">
                     <CalendarDays size={28} className="text-gray-300" />
                     날짜를 선택해주세요
                  </div>
               ) : isLoadingTimes ? (
                  <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>
               ) : (
                  <>
                     <h3 className="text-[15px] font-semibold text-gray-900">
                        {format(selectedDate, 'yyyy-MM-dd')} 상담 가능 시간
                     </h3>
                     <div className="mt-4">
                        <TimeSlotGrid slots={slots} onToggle={toggleSlot} />
                     </div>
                  </>
               )}
            </div>

            <button
               type="button"
               onClick={handleSave}
               disabled={!canSave}
               className={`w-full rounded-sm py-3 text-sm font-semibold transition-colors ${
                  canSave
                     ? 'cursor-pointer bg-brand-green text-white hover:bg-[#4D655A]'
                     : 'cursor-not-allowed bg-[#E5E7EB] text-[#9CA3AF]'
               }`}
            >
               {isSaving ? '저장 중...' : '저장하기'}
            </button>
         </div>
      </div>
   );
}
