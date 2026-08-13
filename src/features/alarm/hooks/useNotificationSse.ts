'use client';

import { useEffect, useRef } from 'react';
import { API_BASE_URL } from '@/lib/http';
import { getNotificationSubscribeTicket } from '@/services/notification.service';

// 티켓 발급 실패(네트워크 오류, 액세스 토큰 만료 등)나 연결 끊김 뒤 재연결까지의 대기 시간 -
// 참고 예시처럼 지연 없이 바로 재귀 호출하면 서버가 내려가 있을 때 요청을 무한정 몰아붙이게 된다
const RECONNECT_DELAY_MS = 2000;

// 알림 실시간 구독(SSE). EventSource는 커스텀 헤더를 못 보내 액세스 토큰을 그대로 쓸 수 없어서,
// 먼저 Bearer 인증으로 30초짜리 1회용 티켓을 받고 그 티켓을 쿼리 파라미터로 연결한다.
// EventSource의 표준 자동 재연결은 이미 만료/소진된 티켓으로 같은 URL을 재요청해 401만 반복하므로,
// onerror에서 직접 close 후 티켓을 새로 받아 연결을 통째로 다시 만든다(자동 재연결 대체)
export function useNotificationSse(onEvent: () => void, enabled: boolean) {
   const onEventRef = useRef(onEvent);
   useEffect(() => {
      onEventRef.current = onEvent;
   }, [onEvent]);

   useEffect(() => {
      if (!enabled) return;

      let isActive = true;
      let source: EventSource | null = null;
      let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

      const scheduleReconnect = () => {
         if (!isActive) return;
         reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
      };

      function connect() {
         getNotificationSubscribeTicket()
            .then(({ ticket }) => {
               if (!isActive) return;
               const es = new EventSource(
                  `${API_BASE_URL}/notifications/subscribe?ticket=${encodeURIComponent(ticket)}`,
               );
               source = es;
               es.onmessage = () => {
                  onEventRef.current();
               };
               es.onerror = () => {
                  es.close();
                  if (source === es) source = null;
                  scheduleReconnect();
               };
            })
            .catch(scheduleReconnect);
      }

      connect();

      return () => {
         isActive = false;
         if (reconnectTimer) clearTimeout(reconnectTimer);
         source?.close();
      };
   }, [enabled]);
}
