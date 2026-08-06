'use client';

import { useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { EVENT_TYPE_COLORS, type EventType } from '../types';
import TodayScheduleModal from './TodayScheduleModal';

interface ScheduleItem {
   time: string;
   title: string;
   type: EventType;
}

// 하드코딩된 더미 데이터 — 추후 API 연동 예정
const TODAY_SCHEDULE: ScheduleItem[] = [
   { time: '09:00', title: '팀 스탠드업 미팅', type: '수업/발표' },
   { time: '14:00', title: '알고리즘 특강', type: '수업/발표' },
   { time: '17:00', title: '1:1 코드 리뷰', type: '개인' },
];

export default function TodayScheduleCard() {
   const [showModal, setShowModal] = useState(false);

   return (
      <div className="h-full rounded-sm border border-gray-200 bg-white p-6 lg:p-4">
         <div className="mb-4 flex items-center justify-between lg:mb-2">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
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

         {TODAY_SCHEDULE.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">오늘 등록된 일정이 없습니다</p>
         ) : (
            <ul>
               {TODAY_SCHEDULE.map((item) => (
                  <li
                     key={`${item.time}-${item.title}`}
                     className="flex items-center gap-3 border-b border-gray-100 py-3 last:border-none last:pb-0 lg:py-2"
                  >
                     <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: EVENT_TYPE_COLORS[item.type].dot }}
                     />
                     <span className="w-12 shrink-0 text-sm text-gray-500">{item.time}</span>
                     <span className="truncate text-sm text-gray-900">{item.title}</span>
                  </li>
               ))}
            </ul>
         )}

         {showModal && <TodayScheduleModal items={TODAY_SCHEDULE} onClose={() => setShowModal(false)} />}
      </div>
   );
}
