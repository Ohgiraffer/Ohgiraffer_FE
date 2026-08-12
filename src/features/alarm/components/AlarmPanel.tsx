'use client';

import { useRouter } from 'next/navigation';
import { Bell, Trash2, X } from 'lucide-react';
import { Switch } from '@/components/ui/shadcn/switch';
import SidePanelShell, { PanelHeaderBar } from '@/components/ui/SidePanelShell';
import type { useNotifications } from '../hooks/useNotifications';
import type { NotificationItem } from '../types';

type Props = {
   open: boolean;
   onClose: () => void;
} & ReturnType<typeof useNotifications>;

// 헤더 알림(종 모양) 패널 - 셸(너비/슬라이드인·아웃 효과/타이틀 위치·크기)은 공간 관리 패널과 SidePanelShell을 공유
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

   const handleItemClick = (item: NotificationItem) => {
      markAsRead(item.id);
      if (item.link) {
         onClose();
         router.push(item.link);
      }
   };

   return (
      <SidePanelShell open={open} onClose={onClose} labelledBy="notification-panel-title">
         <PanelHeaderBar titleId="notification-panel-title" onClose={onClose}>
            알림
            {unreadCount > 0 && (
               <span className="flex min-w-5 items-center justify-center rounded-md bg-[#991B1B] px-2 py-0.5 text-xs font-semibold text-white">
                  {unreadCount}
               </span>
            )}
         </PanelHeaderBar>

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
      </SidePanelShell>
   );
}
