'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
   deleteNotification,
   deleteNotifications,
   getNotifications,
   getUnreadNotificationCount,
   markNotificationAsRead,
} from '@/services/notification.service';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import { mapNotificationDto } from '../mapNotification';
import type { NotificationItem } from '../types';

// 실시간 구독(SSE) 대신 이 주기로 안읽음 개수만 가볍게 확인하다가, 값이 바뀌었을 때만 전체 목록을 다시 불러온다
const UNREAD_COUNT_POLL_INTERVAL_MS = 20000;

// 알림 패널 전체 상태 - Header에서 한 번만 호출해서 배지 카운트와 패널에 동일한 상태를 공유해야 함
export function useNotifications() {
   const [notifications, setNotifications] = useState<NotificationItem[]>([]);
   const [selectedIds, setSelectedIds] = useState<number[]>([]);
   // TODO: 알림 설정 저장 API가 아직 없어 지금은 로컬 상태만 - 새로고침하면 항상 켜짐으로 초기화됨
   const [notificationsEnabled, setNotificationsEnabled] = useState(true);
   const [isLoading, setIsLoading] = useState(true);
   const [hasError, setHasError] = useState(false);

   const loadNotifications = useCallback(() => {
      return getNotifications()
         .then((dtos) => {
            setNotifications(dtos.map(mapNotificationDto));
            setHasError(false);
         })
         .catch(() => setHasError(true))
         .finally(() => setIsLoading(false));
   }, []);

   useEffect(() => {
      loadNotifications();
   }, [loadNotifications]);

   // 다시 시도 버튼 전용 - loadNotifications는 성공/실패 여부만 반영하고 로딩 상태는 항상 false로
   // 끝내므로, 재시도 시작 시점에 로딩/에러 상태를 다시 켜는 건 호출부에서 별도로 해줘야 한다
   const retry = () => {
      setIsLoading(true);
      setHasError(false);
      loadNotifications();
   };

   const unreadCount = notifications.filter((notification) => !notification.isRead).length;
   // 폴링 콜백이 매번 최신 unreadCount와 비교해야 하는데, setInterval 클로저가 마운트 시점 값에
   // 고정되지 않도록 ref로 최신값을 따로 들고 있는다
   const unreadCountRef = useRef(unreadCount);
   useEffect(() => {
      unreadCountRef.current = unreadCount;
   }, [unreadCount]);

   useEffect(() => {
      const interval = setInterval(() => {
         getUnreadNotificationCount()
            .then(({ unreadCount: serverUnreadCount }) => {
               if (serverUnreadCount !== unreadCountRef.current) loadNotifications();
            })
            .catch(() => {
               // 배지 갱신용 폴링이라 실패해도 조용히 무시(다음 주기에 다시 시도)
            });
      }, UNREAD_COUNT_POLL_INTERVAL_MS);
      return () => clearInterval(interval);
   }, [loadNotifications]);

   const isAllSelected = notifications.length > 0 && selectedIds.length === notifications.length;

   const toggleSelected = (id: number) => {
      setSelectedIds((prev) =>
         prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id],
      );
   };

   const toggleSelectAll = () => {
      setSelectedIds(isAllSelected ? [] : notifications.map((notification) => notification.id));
   };

   // 알림을 클릭해서 관련 페이지로 이동했을 때 읽음 처리 - 실패하면 조용히 되돌린다(재클릭하면 다시 시도됨)
   const markAsRead = (id: number) => {
      const target = notifications.find((notification) => notification.id === id);
      if (!target || target.isRead) return;

      setNotifications((prev) =>
         prev.map((notification) => (notification.id === id ? { ...notification, isRead: true } : notification)),
      );
      markNotificationAsRead(id).catch(() => {
         setNotifications((prev) =>
            prev.map((notification) => (notification.id === id ? { ...notification, isRead: false } : notification)),
         );
      });
   };

   const removeSelected = () => {
      if (selectedIds.length === 0) return;
      const idsToDelete = selectedIds;
      const previousNotifications = notifications;
      setNotifications((prev) => prev.filter((notification) => !idsToDelete.includes(notification.id)));
      setSelectedIds([]);
      deleteNotifications(idsToDelete).catch((err) => {
         setNotifications(previousNotifications);
         setSelectedIds(idsToDelete);
         toast.error(
            err instanceof ApiError ? err.message : '알림을 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.',
         );
      });
   };

   const removeOne = (id: number) => {
      const previousNotifications = notifications;
      setNotifications((prev) => prev.filter((notification) => notification.id !== id));
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
      deleteNotification(id).catch((err) => {
         setNotifications(previousNotifications);
         toast.error(
            err instanceof ApiError ? err.message : '알림을 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.',
         );
      });
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
      isLoading,
      hasError,
      retry,
   };
}
