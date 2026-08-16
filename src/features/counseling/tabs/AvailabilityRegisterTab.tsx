'use client';

import { CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/loading/Skeleton';
import CounselingCalendar from '../components/CounselingCalendar';
import TimeSlotGrid from '../components/TimeSlotGrid';
import { useAvailabilityRegister } from '../hooks/useAvailabilityRegister';

// 운영진 "가능 시간 등록" 탭
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
                  <>
                     <Skeleton width={160} height={16} className="rounded-md" />
                     <div className="mt-4 grid grid-cols-7 gap-2">
                        {Array.from({ length: 21 }).map((_, i) => (
                           <Skeleton key={i} width="100%" height={40} className="rounded-sm" />
                        ))}
                     </div>
                  </>
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
