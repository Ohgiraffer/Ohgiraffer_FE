'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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

// react-big-calendar는 대시보드 첫 화면에서만 쓰이는 무거운 라이브러리라, 클라이언트 JS는 별도 청크로 분리한다.
// 다만 ssr:false는 아니다 - LCP 요소가 이 캘린더라 서버가 미리 렌더링해서 초기 HTML에 포함시켜야 한다
// (ssr:false였을 때는 청크 로드가 끝나야만 그려져서 LCP가 늦어졌음)
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
   // 서버(DashboardContent)에서 계산한 초기 연·월 - 여기서 다시 new Date()를 부르면
   // DashboardCalendar가 쓰는 값과 어긋날 수 있어 그대로 물려받아 쓴다
   initialYear: number;
   initialMonth: number;
}

export default function DashboardGrid({ holidays, initialYear, initialMonth }: DashboardGridProps) {
   // 캘린더와 오늘 일정 카드가 각자 따로 오늘이 속한 달의 일정을 조회하던 걸, 여기서 한 번만 조회해 둘 다에 내려줌
   const [monthEvents, setMonthEvents] = useState<CalendarEvent[] | null>(null);
   const [monthEventsError, setMonthEventsError] = useState(false);
   const [refreshKey, setRefreshKey] = useState(0);

   // 캘린더 실제 렌더링 높이를 재서 4개 카드의 높이를 그 절반으로 고정한다(스크롤 없이 - 오늘
   // 일정/공지사항은 목록 자체를 최대 5개로 잘라서 넘치지 않게 함). 캘린더는 두 행(today+
   // attendance / notice+todo)에 걸쳐 있어서 카드 1개 높이는 캘린더 전체가 아니라 절반이어야
   // 두 행을 합친 높이가 캘린더 높이와 맞아떨어진다. react-big-calendar는 월마다 주 수(4~6주)가
   // 달라 높이가 바뀔 수 있어 한 번만 재지 않고 ResizeObserver로 계속 추적한다
   const calendarWrapperRef = useRef<HTMLDivElement>(null);
   const [cardHeight, setCardHeight] = useState<number>();

   useEffect(() => {
      const el = calendarWrapperRef.current;
      if (!el) return;
      const observer = new ResizeObserver((entries) => {
         const height = entries[0]?.contentRect.height;
         if (!height || !el.parentElement) return;
         // 두 행 사이에도 그리드 gap(row-gap)이 한 번 끼어 있다 - 그 gap을 빼지 않고 그냥
         // 절반씩 나누면 "카드 높이 * 2 + gap"이 캘린더 높이보다 gap만큼 더 길어진다
         const rowGap = parseFloat(getComputedStyle(el.parentElement).rowGap) || 0;
         setCardHeight((height - rowGap) / 2);
      });
      observer.observe(el);
      return () => observer.disconnect();
   }, []);

   useEffect(() => {
      let isMounted = true;
      getCalendarEvents(initialYear, initialMonth)
         .then((items) => {
            if (!isMounted) return;
            setMonthEvents(
               items
                  .map(mapCalendarEvent)
                  .filter((event): event is CalendarEvent => event !== null),
            );
            setMonthEventsError(false);
         })
         .catch(() => {
            if (isMounted) setMonthEventsError(true);
         });
      return () => {
         isMounted = false;
      };
   }, [refreshKey, initialYear, initialMonth]);

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
         {/* self-start - 기본값(stretch)이면 이 그리드 셀이 행 높이에 맞춰 늘어나는데, 지금
            행 높이는 카드들의 고정 height(캘린더 높이의 절반)로 정해진다. 그러면 "캘린더 높이를
            재서 카드 높이를 정하고 → 그 카드 높이가 행 높이를 정하고 → 그 행 높이가 다시 캘린더
            높이로 측정되는" 순환 참조가 생겨 높이가 렌더될 때마다 계속 불어난다. self-start로
            이 셀을 행 높이 스트레치에서 빼면 캘린더는 항상 자기 콘텐츠(react-big-calendar의
            고정 600px + 헤더)만큼의 고유 높이로 안정적으로 측정된다 */}
         <div ref={calendarWrapperRef} className="min-w-0 self-start [grid-area:calendar]">
            <DashboardCalendar
               holidays={holidays}
               initialYear={initialYear}
               initialMonth={initialMonth}
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
               cardHeight={cardHeight}
            />
         </div>
         <div className="min-w-0 [grid-area:attendance]">
            <AttendanceCard cardHeight={cardHeight} />
         </div>
         <div className="min-w-0 [grid-area:notice]">
            <NoticeCard cardHeight={cardHeight} />
         </div>
         <div className="min-w-0 [grid-area:todo]">
            <TodoCard cardHeight={cardHeight} />
         </div>
      </div>
   );
}
