'use client';

import { useMemo, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { Skeleton } from '@/components/ui/loading/Skeleton';
import { EVENT_TYPE_COLORS, type CalendarEvent, type EventType } from '../types';
import { isEventInDay } from '../calendarEventUtils';
import TodayScheduleModal from './TodayScheduleModal';

interface ScheduleItem {
   id: string;
   time: string;
   title: string;
   type: EventType;
}

interface TodayScheduleCardProps {
   // null이면 아직 로딩 중이라는 뜻
   events: CalendarEvent[] | null;
   hasError: boolean;
   onRetry: () => void;
}

export default function TodayScheduleCard({ events, hasError, onRetry }: TodayScheduleCardProps) {
   const [showModal, setShowModal] = useState(false);
   const isLoading = events === null && !hasError;

   const items = useMemo<ScheduleItem[]>(() => {
      if (!events) return [];
      const today = new Date();
      return events
         .filter((event) => isEventInDay(event.start, event.end, today))
         .sort((a, b) => a.start.getTime() - b.start.getTime())
         .map((event) => ({
            id: event.id,
            time: event.allDay ? '종일' : (event.startTime ?? ''),
            title: event.title,
            type: event.type,
         }));
   }, [events]);

   return (
      <div className="h-full rounded-sm border border-gray-200 bg-white p-6 lg:p-6">
         <div className="mb-4 flex items-center justify-between lg:mb-4">
            <h2 className="flex items-center gap-1.5 -ml-1 text-sm font-bold text-gray-900">
               <CalendarClock size={16} className="text-gray-400" />
               오늘 일정
            </h2>
            <button
               type="button"
               onClick={() => setShowModal(true)}
               className="cursor-pointer text-xs text-gray-400 hover:text-gray-600"
            >
               더보기
            </button>
         </div>

         {isLoading ? (
            <ul>
               {[0, 1, 2].map((i) => (
                  <li
                     key={i}
                     className="flex items-center gap-3 border-b border-gray-100 py-3 last:border-none last:pb-0 lg:py-2"
                  >
                     <Skeleton width={8} height={8} className="shrink-0 rounded-full" />
                     <Skeleton width={40} height={12} className="shrink-0 rounded-md" />
                     <Skeleton width="60%" height={14} className="rounded-md" />
                  </li>
               ))}
            </ul>
         ) : hasError ? (
            <div className="flex flex-col items-center gap-2 py-6">
               <p className="text-sm text-gray-400">일정을 불러오지 못했습니다.</p>
               <button
                  type="button"
                  onClick={onRetry}
                  className="cursor-pointer rounded-xs border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
               >
                  다시 시도
               </button>
            </div>
         ) : items.length === 0 ? (
            <p className="break-keep py-6 text-center text-sm text-gray-400">오늘 등록된 일정이 없습니다</p>
         ) : (
            <ul>
               {items.map((item) => (
                  <li
                     key={item.id}
                     className="flex items-center gap-3 border-b border-gray-100 py-3 last:border-none last:pb-0 lg:py-2"
                  >
                     <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: EVENT_TYPE_COLORS[item.type].dot }}
                     />
                     <span className="w-12 shrink-0 text-sm text-gray-500">{item.time}</span>
                     <span title={item.title} className="min-w-0 flex-1 truncate text-sm text-gray-900">
                        {item.title}
                     </span>
                  </li>
               ))}
            </ul>
         )}

         {showModal && <TodayScheduleModal items={items} onClose={() => setShowModal(false)} />}
      </div>
   );
}
