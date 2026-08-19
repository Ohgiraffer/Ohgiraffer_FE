'use client';

import { useMemo, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import AnimatedHeight from '@/components/ui/loading/AnimatedHeight';
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

// 카드 높이가 캘린더 절반으로 고정돼 있어 스크롤 없이 다 보여줄 수 있는 만큼만 그린다
const VISIBLE_ITEM_LIMIT = 6;

interface TodayScheduleCardProps {
   // null이면 아직 로딩 중이라는 뜻
   events: CalendarEvent[] | null;
   hasError: boolean;
   onRetry: () => void;
   // 캘린더 높이의 절반으로 카드 높이를 고정한다. 아직 측정 전(undefined)이면 자연스러운 높이로 그린다
   cardHeight?: number;
}

export default function TodayScheduleCard({
   events,
   hasError,
   onRetry,
   cardHeight,
}: TodayScheduleCardProps) {
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
   // "더보기" 모달은 전체 목록을 그대로 보여주고, 카드 안 인라인 목록만 최대 5개로 자른다
   const visibleItems = items.slice(0, VISIBLE_ITEM_LIMIT);

   return (
      <div
         className="flex h-full flex-col rounded-sm border border-gray-200 bg-white p-6 lg:p-6"
         style={cardHeight ? { height: cardHeight } : undefined}
      >
         <div className="mb-4 flex shrink-0 items-center justify-between lg:mb-4">
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

         {/* height는 헤더+패딩까지 포함한 카드 전체(바깥 div)에 고정으로 건다 - 안쪽 콘텐츠에만
            걸면 헤더/패딩만큼 카드 실제 높이가 캘린더 절반보다 더 커진다 */}
         <div className="min-h-0 flex-1">
            <AnimatedHeight>
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
               ) : visibleItems.length === 0 ? (
                  <p className="break-keep py-6 text-center text-sm text-gray-400">
                     오늘 등록된 일정이 없습니다
                  </p>
               ) : (
                  <ul>
                     {visibleItems.map((item) => (
                        <li
                           key={item.id}
                           className="flex items-center gap-3 border-b border-gray-100 py-3 last:border-none last:pb-0 lg:py-2"
                        >
                           <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{ backgroundColor: EVENT_TYPE_COLORS[item.type].dot }}
                           />
                           <span className="w-12 shrink-0 text-sm text-gray-500">{item.time}</span>
                           <span
                              title={item.title}
                              className="min-w-0 flex-1 truncate text-sm text-gray-900"
                           >
                              {item.title}
                           </span>
                        </li>
                     ))}
                  </ul>
               )}
            </AnimatedHeight>
         </div>

         {showModal && <TodayScheduleModal items={items} onClose={() => setShowModal(false)} />}
      </div>
   );
}
