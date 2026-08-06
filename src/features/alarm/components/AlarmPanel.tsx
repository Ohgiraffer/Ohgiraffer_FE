'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Bell, Trash2, X } from 'lucide-react';
import { Switch } from '@/components/ui/shadcn/switch';
import type { useNotifications } from '../hooks/useNotifications';
import type { NotificationItem } from '../types';

// CSS transition-duration과 맞춰야 함 - 닫힌 뒤 이 시간만큼은 슬라이드아웃이 끝나길 기다렸다가 언마운트함
const EXIT_DURATION_MS = 300;

type Props = {
   open: boolean;
   onClose: () => void;
} & ReturnType<typeof useNotifications>;

// 헤더 알림(종 모양) 패널 - 너비/슬라이드인·아웃 효과/타이틀 위치·크기는 공간 관리 패널과 동일하게 맞춤
export default function NotificationPanel({
   open,
   onClose,
   notifications,
   unreadCount,
   selectedIds,
   isAllSelected,
   toggleSelected,
   toggleSelectAll,
   markAsRead,
   removeSelected,
   removeOne,
   notificationsEnabled,
   setNotificationsEnabled,
}: Props) {
   const router = useRouter();
   // open이 꺼져도 곧바로 언마운트하지 않고 퇴장 애니메이션이 끝날 때까지 렌더를 유지함
   const [isMounted, setIsMounted] = useState(open);
   // 마운트 직후 "화면 밖" 상태가 실제로 반영된 뒤에 true로 바뀌면서 들어오는 transition이 재생되고,
   // open이 꺼지면 바로 false로 바뀌면서 같은 transition이 반대로(나가는 방향으로) 재생됨
   const [isVisible, setIsVisible] = useState(false);
   const panelRef = useRef<HTMLDivElement>(null);

   // open → true: 먼저 마운트만 하고(아직 화면 밖), open → false: 즉시 화면 밖으로 트랜지션 시작 + 지연 언마운트
   useEffect(() => {
      if (open) {
         // eslint-disable-next-line react-hooks/set-state-in-effect -- 슬라이드인 전에 먼저 마운트 상태로 전환해야 함
         setIsMounted(true);
         return;
      }

      setIsVisible(false);
      const timeout = setTimeout(() => setIsMounted(false), EXIT_DURATION_MS);
      return () => clearTimeout(timeout);
   }, [open]);

   // 마운트된 직후("화면 밖" 상태) 레이아웃을 한 번 강제로 읽어서 브라우저가 그 값을 확정하도록 만든
   // 다음에 "화면 안" 상태로 바꿔야 트랜지션이 반드시 재생됨. 이 강제 계산 없이 바로 값을 바꾸면
   // 브라우저가 두 상태를 하나로 합쳐버려서 트랜지션 없이 그냥 나타나 버림
   useLayoutEffect(() => {
      if (!open || !isMounted) return;
      if (panelRef.current) {
         void panelRef.current.offsetHeight;
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 위 강제 레이아웃 계산 직후에 상태를 바꿔야 트랜지션이 재생됨
      setIsVisible(true);
   }, [open, isMounted]);

   useEffect(() => {
      if (!isMounted) return;

      const handleKeyDown = (event: KeyboardEvent) => {
         if (event.key === 'Escape') onClose();
      };

      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      return () => {
         document.removeEventListener('keydown', handleKeyDown);
         document.body.style.overflow = '';
      };
   }, [isMounted, onClose]);

   if (!isMounted) return null;

   const handleItemClick = (item: NotificationItem) => {
      markAsRead(item.id);
      if (item.link) {
         onClose();
         router.push(item.link);
      }
   };

   return createPortal(
      // 헤더(h-14) 아래부터 시작 - 배경 오버레이도 패널도 헤더는 가리지 않음
      <div
         className={`fixed inset-x-0 top-14 bottom-0 z-40 flex justify-end bg-black/40 transition-opacity duration-300 ease-out ${
            isVisible ? 'opacity-100' : 'opacity-0'
         }`}
         onClick={onClose}
      >
         <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="notification-panel-title"
            onClick={(event) => event.stopPropagation()}
            className={`flex h-full w-105 flex-col bg-white shadow-lg transition-transform duration-300 ease-out ${
               isVisible ? 'translate-x-0' : 'translate-x-full'
            }`}
         >
            <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
               <h2
                  id="notification-panel-title"
                  className="flex items-center gap-2 text-[18px] font-bold text-gray-900"
               >
                  알림
                  {unreadCount > 0 && (
                     <span className="flex min-w-5 items-center justify-center rounded-md bg-[#991B1B] px-2 py-0.5 text-xs font-semibold text-white">
                        {unreadCount}
                     </span>
                  )}
               </h2>
               <button
                  type="button"
                  onClick={onClose}
                  aria-label="닫기"
                  className="cursor-pointer rounded-sm p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-700"
               >
                  <X size={20} />
               </button>
            </div>

            <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-3">
               <div className="flex items-center gap-3">
                  <label className="flex cursor-pointer rounded-sm items-center gap-2 text-sm px-2.5 py-1.5 border border-[#E5E7EB] text-gray-700">
                     <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        disabled={notifications.length === 0}
                        className="h-4 w-4 cursor-pointer rounded-xs accent-brand-green disabled:cursor-not-allowed"
                     />
                     전체 선택
                  </label>
                  <button
                     type="button"
                     onClick={removeSelected}
                     disabled={selectedIds.length === 0}
                     className={`flex items-center gap-1 rounded-sm px-2.5 py-1.5 text-sm font-medium ${
                        selectedIds.length > 0
                           ? 'cursor-pointer border border-brand-maroon text-brand-maroon hover:bg-[#FEF2F2]'
                           : 'bg-[#F3F4F6] text-[#9CA3AF]'
                     }`}
                  >
                     <Trash2 size={14} />
                     삭제{selectedIds.length > 0 ? ` (${selectedIds.length}건)` : ''}
                  </button>
               </div>

               <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                  aria-label="알림 켜기/끄기"
                  className="cursor-pointer data-checked:bg-brand-green"
               />
            </div>

            <div className="flex-1 overflow-y-auto">
               {notifications.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
                     <Bell size={32} />
                     <p className="text-sm">알림이 없습니다</p>
                  </div>
               ) : (
                  notifications.map((item) => (
                     <div
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className={`relative flex cursor-pointer items-start gap-3 border-b border-[#F3F4F6] px-6 py-4 ${
                           item.isRead ? 'bg-white hover:bg-gray-50' : 'bg-brand-cream/60 '
                        }`}
                     >
                        <input
                           type="checkbox"
                           checked={selectedIds.includes(item.id)}
                           onClick={(event) => event.stopPropagation()}
                           onChange={() => toggleSelected(item.id)}
                           className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded-xs accent-brand-green"
                        />
                        <div className="min-w-0 flex-1">
                           <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                              {!item.isRead && (
                                 <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-green" />
                              )}
                           </div>
                           <p className="mt-0.5 text-sm text-gray-600">{item.description}</p>
                           <p className="mt-1 text-xs text-gray-400">{item.timestamp}</p>
                        </div>
                        <button
                           type="button"
                           onClick={(event) => {
                              event.stopPropagation();
                              removeOne(item.id);
                           }}
                           aria-label={`${item.title} 알림 삭제`}
                           className="shrink-0 cursor-pointer rounded-sm p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                        >
                           <X size={14} />
                        </button>
                     </div>
                  ))
               )}
            </div>
         </div>
      </div>,
      document.body,
   );
}
