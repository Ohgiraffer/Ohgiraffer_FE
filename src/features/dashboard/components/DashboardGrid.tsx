'use client';

import { useState } from 'react';
import DashboardCalendar from './DashboardCalendar';
import TodayScheduleCard from './TodayScheduleCard';
import AttendanceCard from './AttendanceCard';
import NoticeCard from './NoticeCard';
import TodoCard from './TodoCard';
import type { Holiday } from '@/services/holiday.service';

interface DashboardGridProps {
   holidays: Holiday[];
}

export default function DashboardGrid({ holidays }: DashboardGridProps) {
   // 캘린더에서 일정을 등록하면 이 값을 올려서 오늘 일정 카드도 함께 다시 조회하게 한다
   const [todayRefreshKey, setTodayRefreshKey] = useState(0);

   return (
      <div className="dashboard-grid grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-[2fr_0.9fr_0.9fr]">
         <div className="[grid-area:calendar]">
            <DashboardCalendar
               holidays={holidays}
               onEventCreated={() => setTodayRefreshKey((key) => key + 1)}
            />
         </div>
         <div className="[grid-area:today]">
            <TodayScheduleCard refreshKey={todayRefreshKey} />
         </div>
         <div className="[grid-area:attendance]">
            <AttendanceCard />
         </div>
         <div className="[grid-area:notice]">
            <NoticeCard />
         </div>
         <div className="[grid-area:todo]">
            <TodoCard />
         </div>
      </div>
   );
}
