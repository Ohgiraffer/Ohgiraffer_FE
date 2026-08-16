'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
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
import { toast } from '@/lib/toast';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import DayAgendaModal from './DayAgendaModal';

// 일정 등록을 누를 때만 필요한 날짜선택 모달이라 지연 로딩한다
const CreateEventModal = dynamic(() => import('./CreateEventModal'), { ssr: false });
import { EVENT_TYPE_COLORS, type CalendarEvent, type EventType } from '../types';
import { isEventInDay, mapCalendarEvent } from '../calendarEventUtils';
import { deleteCalendarEvent, getCalendarEvents } from '@/services/calendarEvent.service';
import type { Holiday } from '@/services/holiday.service';

export type { CalendarEvent, EventType } from '../types';
export { EVENT_TYPE_COLORS } from '../types';

// 마운트/월 이동 시 조회와 일정 등록 후 새로고침에서 동일하게 쓰는 조회+매핑 로직
async function fetchMappedEvents(year: number, month: number) {
   const items = await getCalendarEvents(year, month);
   return items.map(mapCalendarEvent).filter((event): event is CalendarEvent => event !== null);
}

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
   // 부모(DashboardGrid)가 오늘이 속한 달의 일정을 오늘 일정 카드와 공유하려고 미리 한 번 조회해 내려준다
   initialEvents?: CalendarEvent[] | null;
   initialEventsReady?: boolean;
   onEventCreated?: () => void;
}

export default function DashboardCalendar({
   holidays: initialHolidays = [],
   initialEvents,
   initialEventsReady = false,
   onEventCreated,
}: DashboardCalendarProps) {
   const [events, setEvents] = useState<CalendarEvent[]>([]);
   const [createDate, setCreateDate] = useState<Date | null>(null);
   const [viewDate, setViewDate] = useState<Date | null>(null);
   const [currentDate, setCurrentDate] = useState(() => new Date());

   const [holidaysByYear, setHolidaysByYear] = useState<Record<number, Holiday[]>>(() => ({
      [new Date().getFullYear()]: initialHolidays,
   }));

   const currentYear = currentDate.getFullYear();
   // API의 month는 1~12 (Date.getMonth()는 0부터라 +1)
   const currentMonth = currentDate.getMonth() + 1;

   // react-hooks/refs 규칙상 렌더 중 ref 접근이 금지됨
   const [initialYearMonth] = useState({ year: currentYear, month: currentMonth });
   const [hasHandledInitial, setHasHandledInitial] = useState(false);
   // hasHandledInitial 자체를 재조회 가드로 쓰면 최초 달을 한 번 처리한 뒤로는 영영 true로 고정돼, 
   // 그 뒤 다른 달로 이동해도 재조회가 걸리지 않는 문제가 있었음
   const [loadedYearMonth, setLoadedYearMonth] = useState<{ year: number; month: number } | null>(
      null,
   );

   // 매 요청에 순번을 매겨 가장 마지막에 시작한 요청의 응답만 반영
   const latestRequestIdRef = useRef(0);
   const applyFetchedEvents = useCallback((year: number, month: number) => {
      const requestId = ++latestRequestIdRef.current;
      fetchMappedEvents(year, month)
         .then((mapped) => {
            if (latestRequestIdRef.current === requestId) {
               setEvents(mapped);
               setLoadedYearMonth({ year, month });
            }
         })
         .catch(() => {
            if (latestRequestIdRef.current === requestId) toast.error('일정을 불러오지 못했습니다.');
         });
   }, []);

   const isStillInitialMonth =
      currentYear === initialYearMonth.year && currentMonth === initialYearMonth.month;

   // effect 안에서 setState를 직접 호출할 수 없어(react-hooks/set-state-in-effect), 
   // 부모가 내려준 initialEvents를 그대로 쓰는 이 부분만 렌더 중에 처리
   if (!hasHandledInitial && isStillInitialMonth && initialEventsReady && initialEvents) {
      setHasHandledInitial(true);
      setEvents(initialEvents);
      setLoadedYearMonth({ year: currentYear, month: currentMonth });
   }

   // 화면에 보이는 달이 바뀔 때마다(최초 진입 포함) 그 달의 일정을 다시 불러옴
   useEffect(() => {
      if (isStillInitialMonth && !initialEventsReady) {
         return; // 부모 조회가 아직 끝나지 않음
      }
      if (loadedYearMonth && loadedYearMonth.year === currentYear && loadedYearMonth.month === currentMonth) {
         return; // 이미 이 달의 데이터를 갖고 있다
      }
      applyFetchedEvents(currentYear, currentMonth);
   }, [currentYear, currentMonth, applyFetchedEvents, isStillInitialMonth, initialEventsReady, loadedYearMonth]);

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

   // 공휴일이거나 일요일이면 날짜 숫자를 빨간색으로, 공휴일이면 옆에 공휴일명도 작게 표시
   const DateHeader = useMemo(() => {
      function Header({ date, label, isOffRange }: DateHeaderProps) {
         const holidayName = isOffRange ? undefined : holidaysByDate.get(format(date, 'yyyy-MM-dd'));
         const isSunday = !isOffRange && getDay(date) === 0;
         const isRed = isSunday || Boolean(holidayName);
         return (
            <span className={cn('rbc-button-link', isRed && 'text-brand-red!')}>
               {label}
               {holidayName && (
                  <span className="ml-1 text-[11px] font-normal text-brand-red!">{holidayName}</span>
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

   const handleEventCreated = () => {
      setCreateDate(null);
      applyFetchedEvents(currentYear, currentMonth);
      onEventCreated?.();
   };

   // 건마다 서버에 삭제를 요청하고, 실제로 성공한 건만 로컬에서 지움
   const handleDelete = async (ids: string[]) => {
      const results = await Promise.allSettled(ids.map((id) => deleteCalendarEvent(Number(id))));
      const deletedIds = ids.filter((_, index) => results[index].status === 'fulfilled');
      if (deletedIds.length > 0) {
         setEvents((prev) => prev.filter((event) => !deletedIds.includes(event.id)));
      }
      const failedCount = results.filter((result) => result.status === 'rejected').length;
      if (failedCount > 0) {
         toast.error(`${failedCount}건 삭제에 실패했습니다.`);
      }
   };

   // 시작일만 비교하면 이전 날짜에 시작해 이 날짜까지 걸쳐 있는 일정이 빠지므로 겹침으로 판정
   const viewDateEvents = useMemo(() => {
      if (!viewDate) return [];
      return events.filter((event) => isEventInDay(event.start, event.end, viewDate));
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
               onCreated={handleEventCreated}
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
