'use client';

import { useCallback, useEffect, useState } from 'react';
import { getChannels, type ChatChannel } from '@/services/chat.service';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';

export function useChatChannels() {
   const [channels, setChannels] = useState<ChatChannel[]>([]);
   // 최초값이 이미 true
   const [isLoading, setIsLoading] = useState(true);

   const fetchChannels = useCallback(() => {
      return getChannels()
         .then(setChannels)
         .catch((err) => {
            toast.error(
               err instanceof ApiError
                  ? err.message
                  : '채팅 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
            );
         });
   }, []);

   // 사용자가 직접 다시 불러올 때만 로딩 상태를 true로
   const reload = useCallback(() => {
      setIsLoading(true);
      return fetchChannels().finally(() => setIsLoading(false));
   }, [fetchChannels]);

   useEffect(() => {
      fetchChannels().finally(() => setIsLoading(false));
   }, [fetchChannels]);

   return { channels, isLoading, reload };
}
