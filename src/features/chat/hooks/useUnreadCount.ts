'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { GroupChannelHandler } from '@sendbird/chat/groupChannel';
import { getUnreadCount } from '@/services/chat.service';
import { useSendbird } from '../components/SendbirdProvider';

// Sendbird 연결이 안 됐을 때만 쓰는 폴백 - 연결되면 새 메시지 수신 이벤트로 바로 갱신한다
const UNREAD_POLL_INTERVAL_MS = 20000;

export function useUnreadCount() {
   const { sdk, status } = useSendbird();
   const [totalUnreadCount, setTotalUnreadCount] = useState(0);
   // 느린 이전 요청이 이후 요청보다 늦게 끝나 최신 값을 덮어쓰는 걸 막기 위해 순번을 매긴다
   const requestIdRef = useRef(0);
   const handlerKey = `unread-count-${useId()}`;

   const reload = useCallback(() => {
      const requestId = ++requestIdRef.current;
      // 헤더에 항상 떠 있는 배지라 실패해도 토스트 없이 조용히 무시 (기존 값 유지)
      return getUnreadCount()
         .then((result) => {
            if (requestId !== requestIdRef.current) return;
            setTotalUnreadCount(result.totalUnreadCount);
         })
         .catch(() => {});
   }, []);

   useEffect(() => {
      reload();
   }, [reload]);

   // Sendbird 실시간 연결이 되어 있으면 새 메시지 수신 이벤트로 바로 갱신
   useEffect(() => {
      if (status !== 'connected' || !sdk) return;
      sdk.groupChannel.addGroupChannelHandler(
         handlerKey,
         new GroupChannelHandler({
            onMessageReceived: () => reload(),
         }),
      );
      return () => {
         sdk.groupChannel.removeGroupChannelHandler(handlerKey);
      };
   }, [sdk, status, reload, handlerKey]);

   // 연결이 안 됐을 때만 폴링으로 보완
   useEffect(() => {
      if (status === 'connected') return;
      const interval = setInterval(reload, UNREAD_POLL_INTERVAL_MS);
      return () => clearInterval(interval);
   }, [status, reload]);

   return { totalUnreadCount, reload };
}
