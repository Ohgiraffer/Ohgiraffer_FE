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

// react-big-calendar는 대시보드 첫 화면에서만 쓰이는 무거운 라이브러리라, 초기 파싱과
// 분리되도록 지연 로딩한다
const DashboardCalendar = dynamic(() => import('./DashboardCalendar'), {
   ssr: false,
   loading: () => <DashboardCalendarSkeleton />,
});

function DashboardCalendarSkeleton() {
   return (
      <div className="rounded-xs border border-gray-200 bg-white p-6">
         <div className="mb-4 flex items-center justify-between">
            <Skeleton width={120} height={22} className="rounded-md" />
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
   // 캘린더와 오늘 일정 카드가 각자 따로 오늘이 속한 달의 일정을 조회하던 걸, 여기서 한 번만
   // 조회해 둘 다에 내려준다. 캘린더는 다른 달로 이동하면 그때부터는 알아서 새로 받아온다
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

   // 캘린더에서 일정을 등록했을 때, 그리고 오늘 일정 카드의 "다시 시도" 버튼 둘 다 이걸로 재조회한다
   const refetchMonthEvents = useCallback(() => {
      setRefreshKey((key) => key + 1);
   }, []);

   return (
      <div className="dashboard-grid grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-[2fr_0.9fr_0.9fr]">
         <div className="min-w-0 [grid-area:calendar]">
            <DashboardCalendar
               holidays={holidays}
               initialEvents={monthEvents}
               initialEventsReady={monthEvents !== null || monthEventsError}
               onEventCreated={refetchMonthEvents}
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
