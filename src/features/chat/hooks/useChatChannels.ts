'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getChannels, type ChatChannel } from '@/services/chat.service';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';

export function useChatChannels() {
   const [channels, setChannels] = useState<ChatChannel[]>([]);
   // 최초값이 이미 true
   const [isLoading, setIsLoading] = useState(true);
   // 초기 조회와 reload()가 겹칠 수 있어, 가장 나중에 시작한 요청만 상태를 반영하도록 순번 배부
   const requestIdRef = useRef(0);

   const fetchChannels = useCallback(() => {
      const requestId = ++requestIdRef.current;
      return getChannels()
         .then((result) => {
            if (requestId !== requestIdRef.current) return;
            setChannels(result);
         })
         .catch((err) => {
            if (requestId !== requestIdRef.current) return;
            toast.error(
               err instanceof ApiError
                  ? err.message
                  : '채팅 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
            );
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

   return { channels, isLoading, reload };
}
