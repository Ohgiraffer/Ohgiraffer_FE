'use client';

import { useEffect, useState } from 'react';
import type { ComponentProps } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addMonths, format, getDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { DayButton } from 'react-day-picker';
import { Calendar } from '@/components/ui/shadcn/calendar';
import { cn } from '@/lib/utils';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function toDateKey(date: Date) {
   return format(date, 'yyyy-MM-dd');
}

// 일요일은 빨간색으로(대시보드 달력과 동일한 관례), 설정됨/선택됨은 배경색으로 구분
function CalendarDayButton({ className, modifiers, ...props }: ComponentProps<typeof DayButton>) {
   return (
      <button
         type="button"
         className={cn(
            'flex h-14 w-full items-center justify-center rounded-sm text-[16px] font-medium transition-colors',
            modifiers.outside && 'invisible',
            !modifiers.outside && !modifiers.disabled && 'cursor-pointer hover:bg-gray-50',
            !modifiers.outside && modifiers.disabled && 'text-gray-300',
            !modifiers.outside &&
               !modifiers.disabled &&
               !modifiers.selected &&
               !modifiers.configured &&
               (modifiers.sunday ? 'text-brand-red' : 'text-gray-900'),
            !modifiers.outside &&
               !modifiers.disabled &&
               !modifiers.selected &&
               modifiers.configured &&
               'bg-[#EEF3EF] text-gray-900 hover:bg-[#E3EBE6]',
            modifiers.selected && 'bg-brand-green text-white hover:bg-brand-green',
            className,
         )}
         {...props}
      />
   );
}

type Props = {
   selectedDate: Date | null;
   onSelectDate: (date: Date) => void;
   configuredDates: Set<string>;
   disablePast?: boolean;
   onMonthChange?: (month: Date) => void;
};

export default function CounselingCalendar({
   selectedDate,
   onSelectDate,
   configuredDates,
   disablePast = true,
   onMonthChange,
}: Props) {
   const [viewMonth, setViewMonth] = useState(() => selectedDate ?? new Date());
   const today = new Date();
   today.setHours(0, 0, 0, 0);

   useEffect(() => {
      onMonthChange?.(viewMonth);
   }, [viewMonth]);

   return (
      <div className="rounded-sm border border-gray-200 bg-white p-6">
         <div className="flex items-center justify-between">
            <button
               type="button"
               onClick={() => setViewMonth((month) => addMonths(month, -1))}
               aria-label="이전 달"
               className="cursor-pointer rounded-xs p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-700"
            >
               <ChevronLeft size={20} />
            </button>
            <h2 className="text-lg font-bold text-gray-900">{format(viewMonth, 'yyyy년 M월')}</h2>
            <button
               type="button"
               onClick={() => setViewMonth((month) => addMonths(month, 1))}
               aria-label="다음 달"
               className="cursor-pointer rounded-xs p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-700"
            >
               <ChevronRight size={20} />
            </button>
         </div>

         <div className="mt-4 grid grid-cols-7 text-center text-sm font-semibold text-gray-700">
            {WEEKDAY_LABELS.map((label, index) => (
               <span key={label} className={index === 0 ? 'text-brand-red' : undefined}>
                  {label}
               </span>
            ))}
         </div>

         <Calendar
            mode="single"
            locale={ko}
            month={viewMonth}
            onMonthChange={setViewMonth}
            selected={selectedDate ?? undefined}
            onSelect={(date) => date && onSelectDate(date)}
            disabled={disablePast ? { before: today } : undefined}
            showOutsideDays={false}
            modifiers={{
               configured: (date) => configuredDates.has(toDateKey(date)),
               sunday: (date) => getDay(date) === 0,
            }}
            classNames={{
               root: 'w-full',
               months: 'w-full',
               month: 'w-full',
               nav: 'hidden',
               month_caption: 'hidden',
               weekdays: 'hidden',
               month_grid: 'mt-2 w-full border-collapse',
               week: 'mt-1 flex w-full gap-2',
               day: 'flex-1 p-0',
            }}
            components={{ DayButton: CalendarDayButton }}
         />

         <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
               <span className="h-3 w-3 rounded-xs bg-[#EEF3EF]" />
               설정됨
            </span>
            <span className="flex items-center gap-1.5">
               <span className="h-3 w-3 rounded-xs bg-brand-green" />
               선택됨
            </span>
         </div>
      </div>
   );
}
