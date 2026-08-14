'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { X } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { EVENT_TYPE_COLORS, type EventType } from '../types';

interface ScheduleItem {
   id: string;
   time: string;
   title: string;
   type: EventType;
}

interface TodayScheduleModalProps {
   items: ScheduleItem[];
   onClose: () => void;
}

export default function TodayScheduleModal({ items, onClose }: TodayScheduleModalProps) {
   const title = `${format(new Date(), 'M월 d일', { locale: ko })} 일정`;

   return (
      <Modal onClose={onClose} ariaLabel={title} panelClassName="w-full max-w-112 min-w-85">
         <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">{title}</h2>
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
                     key={item.id}
                     className="flex items-start gap-3 rounded-xs border border-gray-200 px-3 py-2.5"
                  >
                     <span
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: EVENT_TYPE_COLORS[item.type].dot }}
                     />
                     <span className="w-12 shrink-0 text-sm text-gray-500">{item.time}</span>
                     <span className="min-w-0 flex-1 wrap-break-word text-sm font-medium text-gray-900">
                        {item.title}
                     </span>
                  </li>
               ))}
            </ul>
         )}
      </Modal>
   );
}
