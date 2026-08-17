'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import TodayScheduleCard from './TodayScheduleCard';
import AttendanceCard from './AttendanceCard';
import NoticeCard from './NoticeCard';
import TodoCard from './TodoCard';
import { Skeleton } from '@/components/ui/loading/Skeleton';
import { getCalendarEvents } from '@/services/calendarEvent.service';
import { mapCalendarEvent } from '../calendarEventUtils';
import type { CalendarEvent } from '../types';
import type { Holiday } from '@/services/holiday.service';

// react-big-calendar는 대시보드 첫 화면에서만 쓰이는 무거운 라이브러리라, 클라이언트 JS는
// 별도 청크로 분리한다. 다만 ssr:false는 아니다 - LCP 요소가 이 캘린더라 서버가 미리 렌더링해서
// 초기 HTML에 포함시켜야 한다(ssr:false였을 때는 청크 로드가 끝나야만 그려져서 LCP가 늦어졌음)
const DashboardCalendar = dynamic(() => import('./DashboardCalendar'), {
   loading: () => <DashboardCalendarSkeleton />,
});

function DashboardCalendarSkeleton() {
   return (
      <div className="rounded-xs border border-gray-200 bg-white p-6">
         <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <Skeleton width={120} height={22} className="rounded-md" />
               {/* 실제 툴바의 일정 유형 범례(수업/발표·행사·개인) 자리 - 없으면 실제 컴포넌트로
                  바뀔 때 이 줄의 너비/높이가 달라져 레이아웃이 밀린다(CLS) */}
               <div className="flex items-center gap-3">
                  <Skeleton width={48} height={14} className="rounded-md" />
                  <Skeleton width={36} height={14} className="rounded-md" />
                  <Skeleton width={36} height={14} className="rounded-md" />
               </div>
            </div>
            <div className="flex gap-1">
               <Skeleton width={28} height={28} className="rounded-xs" />
               <Skeleton width={28} height={28} className="rounded-xs" />
            </div>
         </div>
         <Skeleton width="100%" height={600} className="rounded-md" />
      </div>
   );
}

interface DashboardGridProps {
   holidays: Holiday[];
}

export default function DashboardGrid({ holidays }: DashboardGridProps) {
   // 캘린더와 오늘 일정 카드가 각자 따로 오늘이 속한 달의 일정을 조회하던 걸, 여기서 한 번만 조회해 둘 다에 내려줌
   const [monthEvents, setMonthEvents] = useState<CalendarEvent[] | null>(null);
   const [monthEventsError, setMonthEventsError] = useState(false);
   const [refreshKey, setRefreshKey] = useState(0);

   useEffect(() => {
      let isMounted = true;
      const today = new Date();
      getCalendarEvents(today.getFullYear(), today.getMonth() + 1)
         .then((items) => {
            if (!isMounted) return;
            setMonthEvents(items.map(mapCalendarEvent).filter((event): event is CalendarEvent => event !== null));
            setMonthEventsError(false);
         })
         .catch(() => {
            if (isMounted) setMonthEventsError(true);
         });
      return () => {
         isMounted = false;
      };
   }, [refreshKey]);

   // effect 안에서 직접 지우면 react-hooks/set-state-in-effect 위반이라 여기서 처리
   const refetchMonthEvents = useCallback(() => {
      setMonthEventsError(false);
      setRefreshKey((key) => key + 1);
   }, []);

   // 캘린더가 최초 조회 실패 이후 같은 달을 자체적으로 재조회해서 성공했을 때 호출됨 -
   // 오늘 일정 카드도 같은 데이터를 받아야 에러 상태에서 벗어난다
   const handleInitialEventsResolved = useCallback((events: CalendarEvent[]) => {
      setMonthEvents(events);
      setMonthEventsError(false);
   }, []);

   return (
      <div className="dashboard-grid grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-[2fr_0.9fr_0.9fr]">
         <div className="min-w-0 [grid-area:calendar]">
            <DashboardCalendar
               holidays={holidays}
               initialEvents={monthEvents}
               initialEventsReady={monthEvents !== null || monthEventsError}
               onEventCreated={refetchMonthEvents}
               onInitialEventsResolved={handleInitialEventsResolved}
               requestGeneration={refreshKey}
            />
         </div>
         <div className="min-w-0 [grid-area:today]">
            <TodayScheduleCard
               events={monthEvents}
               hasError={monthEventsError}
               onRetry={refetchMonthEvents}
            />
         </div>
         <div className="min-w-0 [grid-area:attendance]">
            <AttendanceCard />
         </div>
         <div className="min-w-0 [grid-area:notice]">
            <NoticeCard />
         </div>
         <div className="min-w-0 [grid-area:todo]">
            <TodoCard />
         </div>
      </div>
   );
}
