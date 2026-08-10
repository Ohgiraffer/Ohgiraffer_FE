'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { GroupChannelHandler } from '@sendbird/chat/groupChannel';
import { getChannelDetail, getChannels, type ChatChannel } from '@/services/chat.service';
import { getChatErrorMessage } from '../chatErrors';
import { toast } from '@/lib/toast';
import { useSendbird } from '../components/SendbirdProvider';
import { useAuth } from '@/components/auth/AuthContext';

// Sendbird 연결이 안 됐을 때만 쓰는 폴백 - 연결되면 새 메시지/채널 변경 이벤트로 바로 갱신한다
const CHANNEL_POLL_INTERVAL_MS = 20000;

export function useChatChannels() {
   const { sdk, status } = useSendbird();
   const { me } = useAuth();
   const [channels, setChannels] = useState<ChatChannel[]>([]);
   // 최초값이 이미 true
   const [isLoading, setIsLoading] = useState(true);
   // 초기 조회와 reload()가 겹칠 수 있어, 가장 나중에 시작한 요청만 상태를 반영하도록 순번 배부
   const requestIdRef = useRef(0);
   const handlerKey = `chat-channel-list-${useId()}`;
   // GET /chat/channels의 DM name은 ChatConversation.tsx에서 이미 확인한 것과 같은 이유로
   // (생성 시점에 만든 사람 기준으로 고정된 문구) 상대방이 보면 자기 자신의 이름으로 보인다.
   // 채널당 상대방은 바뀌지 않으므로, 상세 조회(getChannelDetail) 결과를 채널 id 기준으로
   // 캐싱해두고 목록에도 같은 방식으로 실제 상대방 이름을 다시 계산해서 덮어쓴다
   const dmPartnerNameCacheRef = useRef<Map<string, string>>(new Map());

   const resolveDmNames = useCallback(
      async (list: ChatChannel[]) => {
         const myUserId = me?.userId;
         if (myUserId == null) return list;

         const cache = dmPartnerNameCacheRef.current;
         const uncached = list.filter((c) => c.channelType === 'DM' && !cache.has(c.channelId));
         if (uncached.length > 0) {
            await Promise.all(
               uncached.map(async (c) => {
                  try {
                     const detail = await getChannelDetail(c.channelId);
                     const partner = detail.members.find((m) => m.userId !== myUserId);
                     if (partner) cache.set(c.channelId, partner.memberName);
                  } catch {
                     // 조회 실패 시 이번엔 원래 name을 그대로 쓰고, 다음 호출에서 다시 시도한다
                  }
               }),
            );
         }

         return list.map((c) =>
            c.channelType === 'DM' && cache.has(c.channelId)
               ? { ...c, name: cache.get(c.channelId)! }
               : c,
         );
      },
      [me?.userId],
   );

   const fetchChannels = useCallback(
      (options?: { silent?: boolean }) => {
         const silent = options?.silent ?? false;
         const requestId = ++requestIdRef.current;
         return getChannels()
            .then((result) => resolveDmNames(result))
            .then((resolved) => {
               if (requestId !== requestIdRef.current) return;
               setChannels(resolved);
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
      },
      [resolveDmNames],
   );

   // 사용자가 직접 다시 불러올 때만 로딩 상태를 true로 세팅
   const reload = useCallback(() => {
      setIsLoading(true);
      return fetchChannels();
   }, [fetchChannels]);

   useEffect(() => {
      fetchChannels();
   }, [fetchChannels]);

   // Sendbird 실시간 연결이 되어 있으면 새 메시지/채널 변경 이벤트로 목록을 조용히 다시 불러온다
   useEffect(() => {
      if (status !== 'connected' || !sdk) return;
      sdk.groupChannel.addGroupChannelHandler(
         handlerKey,
         new GroupChannelHandler({
            onMessageReceived: () => fetchChannels({ silent: true }),
            onChannelChanged: () => fetchChannels({ silent: true }),
         }),
      );
      return () => {
         sdk.groupChannel.removeGroupChannelHandler(handlerKey);
      };
   }, [sdk, status, fetchChannels, handlerKey]);

   // 연결이 안 됐을 때만 폴링으로 보완
   useEffect(() => {
      if (status === 'connected') return;
      const interval = setInterval(() => {
         fetchChannels({ silent: true });
      }, CHANNEL_POLL_INTERVAL_MS);
      return () => clearInterval(interval);
   }, [status, fetchChannels]);

   return { channels, isLoading, reload };
}
