'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import TodayScheduleCard from './TodayScheduleCard';
import AttendanceCard from './AttendanceCard';
import NoticeCard from './NoticeCard';
import TodoCard from './TodoCard';
import { Skeleton } from '@/components/ui/loading/Skeleton';
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
   // 캘린더에서 일정을 등록하면 이 값을 올려서 오늘 일정 카드도 함께 다시 조회하게 한다
   const [todayRefreshKey, setTodayRefreshKey] = useState(0);

   return (
      <div className="dashboard-grid grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-[2fr_0.9fr_0.9fr]">
         <div className="min-w-0 [grid-area:calendar]">
            <DashboardCalendar
               holidays={holidays}
               onEventCreated={() => setTodayRefreshKey((key) => key + 1)}
            />
         </div>
         <div className="min-w-0 [grid-area:today]">
            <TodayScheduleCard refreshKey={todayRefreshKey} />
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
