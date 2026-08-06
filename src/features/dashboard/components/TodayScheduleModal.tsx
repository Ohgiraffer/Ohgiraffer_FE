'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { X } from 'lucide-react';
import { EVENT_TYPE_COLORS, type EventType } from '../types';

interface ScheduleItem {
   time: string;
   title: string;
   type: EventType;
}

interface TodayScheduleModalProps {
   items: ScheduleItem[];
   onClose: () => void;
}

export default function TodayScheduleModal({ items, onClose }: TodayScheduleModalProps) {
   return (
      <div
         className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
         onClick={onClose}
      >
         <div
            className="w-full max-w-100 min-w-85 rounded-sm bg-white p-6"
            onClick={(e) => e.stopPropagation()}
         >
            <div className="mb-4 flex items-center justify-between">
               <h2 className="text-base font-bold text-gray-900">
                  {format(new Date(), 'M월 d일', { locale: ko })} 일정
               </h2>
               <button type="button" onClick={onClose} aria-label="닫기" className="cursor-pointer">
                  <X size={18} className="text-gray-400" />
               </button>
            </div>

            {items.length === 0 ? (
               <p className="py-6 text-center text-sm text-gray-400">오늘 등록된 일정이 없습니다</p>
            ) : (
               <ul className="flex flex-col gap-2">
                  {items.map((item) => (
                     <li
                        key={`${item.time}-${item.title}`}
                        className="flex items-center gap-3 rounded-sm border border-gray-200 px-3 py-2.5"
                     >
                        <span
                           className="h-2 w-2 shrink-0 rounded-full"
                           style={{ backgroundColor: EVENT_TYPE_COLORS[item.type].dot }}
                        />
                        <span className="w-12 shrink-0 text-sm text-gray-500">{item.time}</span>
                        <span className="truncate text-sm font-medium text-gray-900">{item.title}</span>
                     </li>
                  ))}
               </ul>
            )}
         </div>
      </div>
   );
}
