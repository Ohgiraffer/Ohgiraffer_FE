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
// 한 번에 이보다 많은 새 알림이 도착하면 토스트를 하나씩 띄우지 않고 요약 하나로 묶는다
const TOAST_INDIVIDUAL_LIMIT = 3;

// 알림 패널 전체 상태 - Header에서 한 번만 호출해서 배지 카운트와 패널에 동일한 상태를 공유해야 함
export function useNotifications() {
   const [notifications, setNotifications] = useState<NotificationItem[]>([]);
   const [selectedIds, setSelectedIds] = useState<number[]>([]);
   // TODO: 알림 설정 저장 API가 아직 없어 지금은 로컬 상태만 - 새로고침하면 항상 켜짐으로 초기화됨.
   // 다만 켜짐/꺼짐 자체는 배지·새 알림 토스트 노출 여부에 실제로 반영된다(저장만 안 될 뿐)
   const [notificationsEnabled, setNotificationsEnabled] = useState(true);
   const [isLoading, setIsLoading] = useState(true);
   const [hasError, setHasError] = useState(false);

   // 폴링 콜백/비동기 콜백이 항상 최신 값을 보도록 ref로도 들고 있는다(클로저가 호출 시점 값에 고정되는 것 방지)
   const notificationsEnabledRef = useRef(notificationsEnabled);
   useEffect(() => {
      notificationsEnabledRef.current = notificationsEnabled;
   }, [notificationsEnabled]);

   // 목록 조회(loadNotifications)와 낙관적 변경(읽음/삭제)이 서로 경합할 수 있다 - 예를 들어 조회가
   // 진행 중인 사이에 삭제가 먼저 성공하면, 나중에 도착한 낡은 조회 응답이 삭제한 항목을 되살릴 수 있다.
   // 상태를 바꾸는 시점마다 이 값을 올려두고, 조회 응답을 적용하기 직전에 시작 시점과 비교해서
   // 그 사이 다른 변경이 있었다면(값이 달라졌다면) 낡은 응답이니 버린다
   const stateVersionRef = useRef(0);
   // 어떤 알림을 이미 본 적 있는지 - 최초 로드 이후 새로 나타난 id만 "새 알림"으로 판단해 토스트를 띄운다
   const knownIdsRef = useRef<Set<number> | null>(null);

   const loadNotifications = useCallback(() => {
      const versionAtStart = stateVersionRef.current;
      return getNotifications()
         .then((dtos) => {
            if (stateVersionRef.current !== versionAtStart) return; // 그 사이 다른 변경이 있었던 낡은 응답 - 버림

            const mapped = dtos.map(mapNotificationDto);

            if (knownIdsRef.current) {
               const newOnes = mapped.filter((item) => !knownIdsRef.current!.has(item.id));
               if (newOnes.length > 0 && notificationsEnabledRef.current) {
                  if (newOnes.length <= TOAST_INDIVIDUAL_LIMIT) {
                     newOnes.forEach((item) => toast.warning(`${item.title}\n${item.description}`));
                  } else {
                     toast.warning(`새 알림 ${newOnes.length}건이 도착했습니다.`);
                  }
               }
            }
            knownIdsRef.current = new Set(mapped.map((item) => item.id));

            setNotifications(mapped);
            // 삭제 등으로 이미 사라진 id가 선택 목록에 남아있지 않도록 현재 목록과 교집합으로 정리
            setSelectedIds((prev) => prev.filter((id) => mapped.some((item) => item.id === id)));
            stateVersionRef.current += 1;
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

   const rawUnreadCount = notifications.filter((notification) => !notification.isRead).length;
   // 알림이 꺼져 있으면 배지(헤더 아이콘 + 패널 제목 옆 숫자) 자체를 노출하지 않는다.
   // 목록 조회/폴링은 꺼져 있어도 그대로 돌아가므로, 패널을 직접 열면 실제 미읽음 항목은 여전히 보인다
   const unreadCount = notificationsEnabled ? rawUnreadCount : 0;
   // 폴링 콜백이 매번 최신 미읽음 개수와 비교해야 하는데, setInterval 클로저가 마운트 시점 값에
   // 고정되지 않도록 ref로 최신값(항상 실제 값 기준)을 따로 들고 있는다
   const rawUnreadCountRef = useRef(rawUnreadCount);
   useEffect(() => {
      rawUnreadCountRef.current = rawUnreadCount;
   }, [rawUnreadCount]);

   useEffect(() => {
      const interval = setInterval(() => {
         getUnreadNotificationCount()
            .then(({ unreadCount: serverUnreadCount }) => {
               if (serverUnreadCount !== rawUnreadCountRef.current) loadNotifications();
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

   // 알림을 클릭해서 관련 페이지로 이동했을 때 읽음 처리 - 실패하면 조용히 되돌린다(재클릭하면 다시 시도됨).
   // 목록 전체를 덮어쓰지 않고 해당 항목 하나만 바꾸므로 다른 변경과 부딪혀도 안전하지만, 그 사이
   // 시작된 목록 조회가 이 변경 이전 스냅샷으로 덮어쓰지 않도록 버전은 올려둔다
   const markAsRead = (id: number) => {
      const target = notifications.find((notification) => notification.id === id);
      if (!target || target.isRead) return;

      setNotifications((prev) =>
         prev.map((notification) => (notification.id === id ? { ...notification, isRead: true } : notification)),
      );
      stateVersionRef.current += 1;
      markNotificationAsRead(id).catch(() => {
         setNotifications((prev) =>
            prev.map((notification) => (notification.id === id ? { ...notification, isRead: false } : notification)),
         );
         stateVersionRef.current += 1;
      });
   };

   const removeSelected = () => {
      if (selectedIds.length === 0) return;
      const idsToDelete = selectedIds;
      // 실패 시 실패한 항목만 원래 위치에 되돌리기 위해 삭제 전 위치를 같이 기억해둔다
      const removedEntries = notifications
         .map((notification, index) => ({ notification, index }))
         .filter(({ notification }) => idsToDelete.includes(notification.id));

      setNotifications((prev) => prev.filter((notification) => !idsToDelete.includes(notification.id)));
      setSelectedIds((prev) => prev.filter((id) => !idsToDelete.includes(id)));
      stateVersionRef.current += 1;

      deleteNotifications(idsToDelete).catch((err) => {
         // 스냅샷 전체를 되돌리지 않고, 실패한 항목만 원래 인덱스 순서대로 다시 끼워 넣는다 -
         // 그 사이 다른 항목에 생긴 변경(읽음 처리 등)을 덮어쓰지 않기 위함
         setNotifications((prev) => {
            let result = prev;
            for (const { notification, index } of [...removedEntries].sort((a, b) => a.index - b.index)) {
               if (result.some((item) => item.id === notification.id)) continue;
               const insertAt = Math.min(index, result.length);
               result = [...result.slice(0, insertAt), notification, ...result.slice(insertAt)];
            }
            return result;
         });
         setSelectedIds((prev) => Array.from(new Set([...prev, ...idsToDelete])));
         stateVersionRef.current += 1;
         toast.error(
            err instanceof ApiError ? err.message : '알림을 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.',
         );
      });
   };

   const removeOne = (id: number) => {
      const removedIndex = notifications.findIndex((notification) => notification.id === id);
      if (removedIndex === -1) return;
      const removedItem = notifications[removedIndex];

      setNotifications((prev) => prev.filter((notification) => notification.id !== id));
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
      stateVersionRef.current += 1;

      deleteNotification(id).catch((err) => {
         // 스냅샷 전체가 아니라 이 항목만 원래 위치로 되돌린다(그 사이 다른 변경을 덮어쓰지 않도록)
         setNotifications((prev) => {
            if (prev.some((item) => item.id === id)) return prev;
            const insertAt = Math.min(removedIndex, prev.length);
            return [...prev.slice(0, insertAt), removedItem, ...prev.slice(insertAt)];
         });
         stateVersionRef.current += 1;
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
