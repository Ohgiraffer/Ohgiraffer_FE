'use client';

import { useEffect, useMemo, useState } from 'react';
import {
   Calendar,
   dateFnsLocalizer,
   type DateCellWrapperProps,
   type DateHeaderProps,
   type ToolbarProps,
} from 'react-big-calendar';
import { format, getDay, parse, startOfWeek } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import CreateEventModal from './CreateEventModal';
import DayAgendaModal from './DayAgendaModal';
import { CURRENT_USER, EVENT_TYPE_COLORS, type CalendarEvent, type EventType } from '../types';
import type { Holiday } from '@/services/holiday.service';

export type { CalendarEvent, EventType, UserRole } from '../types';
export { CURRENT_USER, EVENT_TYPE_COLORS } from '../types';

const locales = { ko };

const localizer = dateFnsLocalizer({
   format,
   parse,
   startOfWeek: () => startOfWeek(new Date(), { locale: ko }),
   getDay,
   locales,
});

function CalendarToolbar({ label, onNavigate }: ToolbarProps<CalendarEvent, object>) {
   return (
      <div className="mb-4 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-gray-900">{label}</h2>
            <div className="flex items-center gap-3 text-xs text-gray-500">
               {(Object.keys(EVENT_TYPE_COLORS) as EventType[]).map((type) => (
                  <span key={type} className="flex items-center gap-1">
                     <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: EVENT_TYPE_COLORS[type].dot }}
                     />
                     {type}
                  </span>
               ))}
            </div>
         </div>
         <div className="flex items-center gap-1">
            <button
               type="button"
               onClick={() => onNavigate('PREV')}
               aria-label="이전 달"
               className="rounded-xs p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
               <ChevronLeft size={18} />
            </button>
            <button
               type="button"
               onClick={() => onNavigate('NEXT')}
               aria-label="다음 달"
               className="rounded-xs p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
               <ChevronRight size={18} />
            </button>
         </div>
      </div>
   );
}

interface DashboardCalendarProps {
   holidays?: Holiday[];
}

export default function DashboardCalendar({ holidays: initialHolidays = [] }: DashboardCalendarProps) {
   const [events, setEvents] = useState<CalendarEvent[]>([]);
   const [createDate, setCreateDate] = useState<Date | null>(null);
   const [viewDate, setViewDate] = useState<Date | null>(null);
   const [currentDate, setCurrentDate] = useState(() => new Date());

   // 서버에서 미리 받아온 올해 공휴일로 시작하고, 다른 연도로 이동하면 그때 그 연도만큼만 받아온다
   const [holidaysByYear, setHolidaysByYear] = useState<Record<number, Holiday[]>>(() => ({
      [new Date().getFullYear()]: initialHolidays,
   }));

   const currentYear = currentDate.getFullYear();

   useEffect(() => {
      if (currentYear in holidaysByYear) return;

      let cancelled = false;
      fetch(`/api/holidays?year=${currentYear}`)
         .then((res) => res.json())
         .then((data: Holiday[]) => {
            if (!cancelled) setHolidaysByYear((prev) => ({ ...prev, [currentYear]: data }));
         })
         .catch(() => {
            if (!cancelled) setHolidaysByYear((prev) => ({ ...prev, [currentYear]: [] }));
         });

      return () => {
         cancelled = true;
      };
   }, [currentYear, holidaysByYear]);

   const holidaysByDate = useMemo(() => {
      const map = new Map<string, string>();
      (holidaysByYear[currentYear] ?? []).forEach((holiday) => map.set(holiday.date, holiday.name));
      return map;
   }, [holidaysByYear, currentYear]);

   // 공휴일이거나 일요일이면 날짜 숫자를 빨간색으로, 공휴일이면 옆에 공휴일명도 작게 표시한다
   const DateHeader = useMemo(() => {
      function Header({ date, label, isOffRange }: DateHeaderProps) {
         const holidayName = isOffRange ? undefined : holidaysByDate.get(format(date, 'yyyy-MM-dd'));
         const isSunday = !isOffRange && getDay(date) === 0;
         const isRed = isSunday || Boolean(holidayName);
         return (
            <span className={cn('rbc-button-link', isRed && '!text-brand-red')}>
               {label}
               {holidayName && (
                  <span className="ml-1 text-[11px] font-normal !text-brand-red">{holidayName}</span>
               )}
            </span>
         );
      }
      return Header;
   }, [holidaysByDate]);

   const eventPropGetter = useMemo(
      () => (event: CalendarEvent) => {
         const colors = EVENT_TYPE_COLORS[event.type];
         return {
            style: {
               backgroundColor: colors.bg,
               color: colors.text,
               border: 'none',
               borderRadius: '4px',
               fontSize: '12px',
               fontWeight: 500,
               padding: '2px 8px',
            },
         };
      },
      [],
   );

   // 날짜 칸 어디를 클릭해도 그 날짜의 일정 목록(조회)이 뜨고, 우측 상단 "+"만 등록 모달을 연다
   const DateCellWrapper = useMemo(() => {
      function Wrapper({ value, children }: DateCellWrapperProps) {
         return (
            <div
               className="group relative flex h-full flex-1 cursor-pointer"
               onClick={() => setViewDate(value)}
            >
               {children}
               <button
                  type="button"
                  onClick={(e) => {
                     e.stopPropagation();
                     setCreateDate(value);
                  }}
                  aria-label="일정 추가"
                  className="absolute top-1 right-1 z-50 hidden h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-brand-green text-white hover:bg-[#4D655A] group-hover:flex"
               >
                  <Plus size={14} strokeWidth={3} />
               </button>
            </div>
         );
      }
      return Wrapper;
   }, []);

   const handleCreate = (event: Omit<CalendarEvent, 'id' | 'registrant'>) => {
      setEvents((prev) => [
         ...prev,
         { ...event, id: crypto.randomUUID(), registrant: CURRENT_USER.name },
      ]);
      setCreateDate(null);
   };

   const handleDelete = (ids: string[]) => {
      setEvents((prev) => prev.filter((event) => !ids.includes(event.id)));
   };

   const viewDateEvents = useMemo(() => {
      if (!viewDate) return [];
      return events.filter(
         (event) =>
            event.start.getFullYear() === viewDate.getFullYear() &&
            event.start.getMonth() === viewDate.getMonth() &&
            event.start.getDate() === viewDate.getDate(),
      );
   }, [events, viewDate]);

   return (
      <div className="campflow-calendar rounded-sm border border-gray-200 bg-white p-6">
         <Calendar
            localizer={localizer}
            culture="ko"
            date={currentDate}
            onNavigate={(newDate) => setCurrentDate(newDate)}
            events={events}
            startAccessor="start"
            endAccessor="end"
            views={['month']}
            style={{ height: 600 }}
            formats={{ monthHeaderFormat: 'yyyy년 M월' }}
            eventPropGetter={eventPropGetter}
            popup
            onSelectEvent={(event) => setViewDate(event.start)}
            components={{
               toolbar: CalendarToolbar,
               dateCellWrapper: DateCellWrapper,
               month: { dateHeader: DateHeader },
            }}
         />

         {createDate && (
            <CreateEventModal
               defaultDate={createDate}
               onClose={() => setCreateDate(null)}
               onCreate={handleCreate}
            />
         )}

         {viewDate && (
            <DayAgendaModal
               key={viewDate.toDateString()}
               date={viewDate}
               events={viewDateEvents}
               onClose={() => setViewDate(null)}
               onDelete={handleDelete}
            />
         )}
      </div>
   );
}
