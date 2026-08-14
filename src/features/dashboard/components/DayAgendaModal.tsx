'use client';

import { useRef, useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Trash2, X } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { EVENT_TYPE_COLORS, type CalendarEvent } from './DashboardCalendar';

interface DayAgendaModalProps {
   date: Date;
   events: CalendarEvent[];
   onClose: () => void;
   onDelete: (ids: string[]) => void;
}

function formatTimeRange(startTime?: string, endTime?: string) {
   if (startTime && endTime) return `${startTime} ~ ${endTime}`;
   if (startTime) return `${startTime}~`;
   if (endTime) return `~${endTime}`;
   return null;
}

export default function DayAgendaModal({ date, events, onClose, onDelete }: DayAgendaModalProps) {
   const [checkedIds, setCheckedIds] = useState<string[]>([]);
   const isDeletingRef = useRef(false);

   const toggleChecked = (id: string) => {
      setCheckedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
   };

   // 서버 데이터의 editable이 명시적으로 false인 일정(남의 일정·공휴일)만 삭제를 막는다.
   // 로컬로 새로 등록한 일정은 editable이 없어도(undefined) 삭제 가능하게 둔다
   const canDelete = (event: CalendarEvent) => event.editable !== false;

   const handleDelete = () => {
      // 더블클릭으로 인한 중복 삭제 요청 방지 (state의 disabled만으로는 비동기 업데이트 특성상 완전히 막을 수 없음)
      if (isDeletingRef.current || checkedIds.length === 0) return;
      isDeletingRef.current = true;
      onDelete(checkedIds);
      isDeletingRef.current = false;
      onClose();
   };

   const title = `${format(date, 'M월 d일', { locale: ko })} 일정`;

   return (
      <Modal onClose={onClose} ariaLabel={title} panelClassName="w-full max-w-100 min-w-85">
         <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">{title}</h2>
            <button type="button" onClick={onClose} aria-label="닫기" className="cursor-pointer">
               <X size={18} className="text-gray-400" />
            </button>
         </div>

         {events.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">등록된 일정이 없습니다</p>
         ) : (
            <ul className="mb-4 flex flex-col gap-2">
               {events.map((event) => {
                  const colors = EVENT_TYPE_COLORS[event.type];
                  const metaText = event.allDay ? '종일' : formatTimeRange(event.startTime, event.endTime);
                  return (
                     <li
                        key={event.id}
                        className="flex items-center gap-3 rounded-xs border border-gray-200 px-3 py-2.5"
                     >
                        <input
                           type="checkbox"
                           checked={canDelete(event) && checkedIds.includes(event.id)}
                           disabled={!canDelete(event)}
                           onChange={() => toggleChecked(event.id)}
                           className="h-4 w-4 shrink-0 cursor-pointer accent-brand-green disabled:cursor-not-allowed disabled:accent-gray-300"
                        />
                        <div className="flex min-w-0 flex-1 flex-col">
                           <span className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-gray-900">
                              <span
                                 title={event.place ? `${event.title} (${event.place})` : event.title}
                                 className="truncate"
                              >
                                 {event.title}
                                 {event.place && (
                                    <span className="font-normal text-gray-400"> ({event.place})</span>
                                 )}
                              </span>
                              <span
                                 className="h-2 w-2 shrink-0 rounded-full"
                                 style={{ backgroundColor: colors.dot }}
                              />
                           </span>
                           {metaText && <span className="text-xs text-gray-400">{metaText}</span>}
                        </div>
                     </li>
                  );
               })}
            </ul>
         )}

         {events.length > 0 && (
            <button
               type="button"
               onClick={handleDelete}
               disabled={checkedIds.length === 0}
               className="flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xs bg-brand-maroon text-sm font-medium text-white transition-colors hover:bg-[#832E2E] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
            >
               <Trash2 size={15} />
               삭제 ({checkedIds.length})
            </button>
         )}
      </Modal>
   );
}
