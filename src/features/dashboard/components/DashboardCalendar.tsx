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
   // 부모(DashboardGrid)가 오늘이 속한 달의 일정을 오늘 일정 카드와 공유하려고 미리 한 번
   // 조회해 내려준다 - 마운트 시 같은 달을 또 조회하지 않고 이 값을 그대로 쓴다. initialEventsReady는
   // 부모의 조회가 끝났는지(성공/실패 무관) 나타낸다 - 끝나기 전까지는 기다렸다가 한 번만 소비한다
   initialEvents?: CalendarEvent[] | null;
   initialEventsReady?: boolean;
   // 일정 등록 성공 시 대시보드의 다른 카드(오늘 일정 등)도 함께 갱신하도록 알려준다
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

   // 서버에서 미리 받아온 올해 공휴일로 시작하고, 다른 연도로 이동하면 그때 그 연도만큼만 받아온다
   const [holidaysByYear, setHolidaysByYear] = useState<Record<number, Holiday[]>>(() => ({
      [new Date().getFullYear()]: initialHolidays,
   }));

   const currentYear = currentDate.getFullYear();
   // API의 month는 1~12 (Date.getMonth()는 0부터라 +1)
   const currentMonth = currentDate.getMonth() + 1;

   // 마운트 시 보여주는 달(=오늘이 속한 달) - 부모가 내려준 initialEvents가 이 달의 것과
   // 일치하는 동안에만 재사용할 수 있다. ref가 아니라 state로 두는 이유는 렌더 중에 읽고 쓸 수
   // 있어야 해서다(react-hooks/refs 규칙상 렌더 중 ref 접근이 금지됨)
   const [initialYearMonth] = useState({ year: currentYear, month: currentMonth });
   const [hasHandledInitial, setHasHandledInitial] = useState(false);
   // events state가 지금 어느 연/월 데이터인지 - 이게 currentYear/currentMonth와 다르면 재조회한다.
   // (hasHandledInitial 자체를 재조회 가드로 쓰면 최초 달을 한 번 처리한 뒤로는 영영 true로
   // 고정돼, 그 뒤 다른 달로 이동해도 재조회가 걸리지 않는 문제가 있었다)
   const [loadedYearMonth, setLoadedYearMonth] = useState<{ year: number; month: number } | null>(
      null,
   );

   // 월 이동 중 등록으로 재조회가 겹치면(초기 조회가 나중에 끝나는 경우) 오래된 응답이 최신
   // 상태를 덮어쓸 수 있다 - 매 요청에 순번을 매겨 가장 마지막에 시작한 요청의 응답만 반영한다
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

   // effect 안에서 setState를 직접 호출할 수 없어(react-hooks/set-state-in-effect), 부모가 내려준
   // initialEvents를 그대로 쓰는 이 부분만 렌더 중에 처리한다(TeamWorkspaceLink.tsx 등과 같은 패턴)
   if (!hasHandledInitial && isStillInitialMonth && initialEventsReady && initialEvents) {
      setHasHandledInitial(true);
      setEvents(initialEvents);
      setLoadedYearMonth({ year: currentYear, month: currentMonth });
   }

   // 화면에 보이는 달이 바뀔 때마다(최초 진입 포함) 그 달의 일정을 다시 불러온다 - 다만 최초
   // 진입 달만큼은 부모가 이미 조회해둔 값을 위에서 그대로 썼다면(loadedYearMonth가 이미 이
   // 달을 가리킴) 여기서 또 조회하지 않는다
   useEffect(() => {
      if (isStillInitialMonth && !initialEventsReady) {
         return; // 부모 조회가 아직 끝나지 않았다 - initialEventsReady가 바뀌면 이 effect가 다시 돈다
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

   // 공휴일이거나 일요일이면 날짜 숫자를 빨간색으로, 공휴일이면 옆에 공휴일명도 작게 표시한다
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

   const handleEventCreated = () => {
      setCreateDate(null);
      applyFetchedEvents(currentYear, currentMonth);
      onEventCreated?.();
   };

   // 건마다 서버에 삭제를 요청하고, 실제로 성공한 건만 로컬에서 지운다(한 건이 실패해도
   // 나머지는 지워지므로 로컬 상태가 서버와 어긋나지 않게 성공한 id만 반영한다)
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

   // 시작일만 비교하면 이전 날짜에 시작해 이 날짜까지 걸쳐 있는 일정이 빠지므로 겹침으로 판정한다
   const viewDateEvents = useMemo(() => {
      if (!viewDate) return [];
      return events.filter((event) => isEventInDay(event.start, event.end, viewDate));
   }, [events, viewDate]);

   return (
      <div className="campflow-calendar rounded-xs border border-gray-200 bg-white p-6">
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
