'use client';

import { useCallback, useEffect, useState } from 'react';
import { getUnreadCount } from '@/services/chat.service';

// 실시간 푸시가 없어, 헤더 배지가 조용히 주기적으로 다시 확인되도록 함
const UNREAD_POLL_INTERVAL_MS = 20000;

export function useUnreadCount() {
   const [totalUnreadCount, setTotalUnreadCount] = useState(0);

   const reload = useCallback(() => {
      // 헤더에 항상 떠 있는 배지라 실패해도 토스트 없이 조용히 무시 (기존 값 유지)
      return getUnreadCount()
         .then((result) => setTotalUnreadCount(result.totalUnreadCount))
         .catch(() => {});
   }, []);

   useEffect(() => {
      reload();
   }, [reload]);

   useEffect(() => {
      const interval = setInterval(reload, UNREAD_POLL_INTERVAL_MS);
      return () => clearInterval(interval);
   }, [reload]);

   return { totalUnreadCount, reload };
}
