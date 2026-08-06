'use client';

import { useState } from 'react';
import { MOCK_NOTIFICATIONS } from '../mockData';
import type { NotificationItem } from '../types';

// 알림 패널 전체 상태 - Header에서 한 번만 호출해서 배지 카운트와 패널에 동일한 상태를 공유해야 함
export function useNotifications() {
   const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
   const [selectedIds, setSelectedIds] = useState<string[]>([]);
   const [notificationsEnabled, setNotificationsEnabled] = useState(true);

   const unreadCount = notifications.filter((notification) => !notification.isRead).length;
   const isAllSelected = notifications.length > 0 && selectedIds.length === notifications.length;

   const toggleSelected = (id: string) => {
      setSelectedIds((prev) =>
         prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id],
      );
   };

   const toggleSelectAll = () => {
      setSelectedIds(isAllSelected ? [] : notifications.map((notification) => notification.id));
   };

   // 알림을 클릭해서 관련 페이지로 이동했을 때 읽음 처리 - 실제로는 백엔드가 방문 여부로 판단할 예정
   const markAsRead = (id: string) => {
      setNotifications((prev) =>
         prev.map((notification) =>
            notification.id === id ? { ...notification, isRead: true } : notification,
         ),
      );
   };

   const removeSelected = () => {
      setNotifications((prev) =>
         prev.filter((notification) => !selectedIds.includes(notification.id)),
      );
      setSelectedIds([]);
   };

   const removeOne = (id: string) => {
      setNotifications((prev) => prev.filter((notification) => notification.id !== id));
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
   };

   return {
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
   };
}
