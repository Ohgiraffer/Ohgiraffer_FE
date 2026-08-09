'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getChannels, type ChatChannel } from '@/services/chat.service';
import { getChatErrorMessage } from '../chatErrors';
import { toast } from '@/lib/toast';

// 실시간 푸시가 없어, 채팅 목록(마지막 메시지/안읽음 등)이 조용히 주기적으로 다시 확인되도록 함
const CHANNEL_POLL_INTERVAL_MS = 20000;

export function useChatChannels() {
   const [channels, setChannels] = useState<ChatChannel[]>([]);
   // 최초값이 이미 true
   const [isLoading, setIsLoading] = useState(true);
   // 초기 조회와 reload()가 겹칠 수 있어, 가장 나중에 시작한 요청만 상태를 반영하도록 순번 배부
   const requestIdRef = useRef(0);

   const fetchChannels = useCallback((options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      const requestId = ++requestIdRef.current;
      return getChannels()
         .then((result) => {
            if (requestId !== requestIdRef.current) return;
            setChannels(result);
         })
         .catch((err) => {
            if (requestId !== requestIdRef.current) return;
            // 백그라운드 폴링 실패는 조용히 무시 - 사용자가 직접 새로고침할 때만 토스트를 띄운다
            if (!silent) {
               toast.error(getChatErrorMessage(err, '채팅 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'));
            }
         })
         .finally(() => {
            if (requestId !== requestIdRef.current) return;
            setIsLoading(false);
         });
   }, []);

   // 사용자가 직접 다시 불러올 때만 로딩 상태를 true로 세팅
   const reload = useCallback(() => {
      setIsLoading(true);
      return fetchChannels();
   }, [fetchChannels]);

   useEffect(() => {
      fetchChannels();
   }, [fetchChannels]);

   useEffect(() => {
      const interval = setInterval(() => {
         fetchChannels({ silent: true });
      }, CHANNEL_POLL_INTERVAL_MS);
      return () => clearInterval(interval);
   }, [fetchChannels]);

   return { channels, isLoading, reload };
}
