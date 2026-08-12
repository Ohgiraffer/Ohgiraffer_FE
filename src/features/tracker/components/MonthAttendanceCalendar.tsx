'use client';

import { useState } from 'react';
import { addMonths, endOfMonth, format, getDay, startOfMonth, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
   ATTENDANCE_STATUS_COLOR_GROUP,
   type AttendanceColorGroup,
   type AttendanceDayRecord,
} from '../types';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// 대시보드 출결 요약 카드(AttendanceCard)와 같은 색 규칙: 출석 계열은 초록, 지각/조퇴/외출은
// brand-red, 결석만 더 진한 brand-maroon으로 구분한다
const COLOR_GROUP_TEXT_CLASSES: Record<AttendanceColorGroup, string> = {
   green: 'text-brand-green font-semibold',
   pink: 'text-brand-red font-semibold',
   red: 'text-brand-maroon font-bold',
};

interface MonthAttendanceCalendarProps {
   initialDate?: Date;
   records: AttendanceDayRecord[];
}

export default function MonthAttendanceCalendar({ initialDate, records }: MonthAttendanceCalendarProps) {
   const [currentDate, setCurrentDate] = useState(() => initialDate ?? new Date());

   const recordsByDate = new Map(records.map((record) => [record.date, record]));

   const monthStart = startOfMonth(currentDate);
   const monthEnd = endOfMonth(currentDate);
   const startWeekday = getDay(monthStart);

   const days: (Date | null)[] = Array.from({ length: startWeekday }, () => null);
   for (let day = 1; day <= monthEnd.getDate(); day++) {
      days.push(new Date(monthStart.getFullYear(), monthStart.getMonth(), day));
   }
   const weeks: (Date | null)[][] = [];
   for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
   }

   return (
      <div>
         <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">{format(currentDate, 'yyyy년 M월')}</h3>
            <div className="flex items-center gap-1">
               <button
                  type="button"
                  onClick={() => setCurrentDate((prev) => subMonths(prev, 1))}
                  aria-label="이전 달"
                  className="cursor-pointer rounded-xs p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
               >
                  <ChevronLeft size={18} />
               </button>
               <button
                  type="button"
                  onClick={() => setCurrentDate((prev) => addMonths(prev, 1))}
                  aria-label="다음 달"
                  className="cursor-pointer rounded-xs p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
               >
                  <ChevronRight size={18} />
               </button>
            </div>
         </div>

         <div className="mt-4 grid grid-cols-7 text-center text-xs text-gray-400">
            {WEEKDAYS.map((weekday) => (
               <div key={weekday} className="py-1">
                  {weekday}
               </div>
            ))}
         </div>

         <div className="grid grid-cols-7 text-center text-sm">
            {weeks.flatMap((week, weekIndex) =>
               week.map((date, dayIndex) => {
                  const key = `${weekIndex}-${dayIndex}`;
                  if (!date) return <div key={key} className="py-2.5" />;

                  const dateStr = format(date, 'yyyy-MM-dd');
                  const record = recordsByDate.get(dateStr);
                  const colorGroup = record ? ATTENDANCE_STATUS_COLOR_GROUP[record.status] : null;

                  return (
                     <div key={key} className="py-2.5">
                        <span className={cn('text-gray-700', colorGroup && COLOR_GROUP_TEXT_CLASSES[colorGroup])}>
                           {date.getDate()}
                        </span>
                     </div>
                  );
               }),
            )}
         </div>

         <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
               <span className="h-2.5 w-2.5 rounded-xs bg-brand-green" />
               출석·휴가·병결
            </span>
            <span className="flex items-center gap-1.5">
               <span className="h-2.5 w-2.5 rounded-xs bg-brand-red" />
               지각·조퇴·외출
            </span>
            <span className="flex items-center gap-1.5">
               <span className="h-2.5 w-2.5 rounded-xs bg-brand-maroon" />
               결석
            </span>
         </div>
      </div>
   );
}
