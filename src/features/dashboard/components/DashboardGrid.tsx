'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import DashboardCalendar from './DashboardCalendar';
import TodayScheduleCard from './TodayScheduleCard';
import AttendanceCard from './AttendanceCard';
import NoticeCard from './NoticeCard';
import TodoCard from './TodoCard';
import type { Holiday } from '@/services/holiday.service';

interface DashboardGridProps {
   holidays: Holiday[];
}

// 캘린더 확대 상태를 여기서 들고 있다가 그리드 레이아웃(칼럼 수·grid-template-areas)과
// DashboardCalendar에 함께 내려준다 - 확대되면 캘린더가 위쪽 전체 폭을 차지하고 요약 카드
// 4개는 그 아래로 내려간다(dashboard-grid-expanded, globals.css)
export default function DashboardGrid({ holidays }: DashboardGridProps) {
   const [isExpanded, setIsExpanded] = useState(false);

   return (
      <div
         className={cn(
            'dashboard-grid grid grid-cols-1 gap-6 sm:grid-cols-2',
            isExpanded ? 'dashboard-grid-expanded lg:grid-cols-4' : 'lg:grid-cols-[2fr_0.9fr_0.9fr]',
         )}
      >
         <div className="[grid-area:calendar]">
            <DashboardCalendar
               holidays={holidays}
               isExpanded={isExpanded}
               onToggleExpand={() => setIsExpanded((prev) => !prev)}
            />
         </div>
         <div className="[grid-area:today]">
            <TodayScheduleCard />
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
