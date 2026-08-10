'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { SessionHandler } from '@sendbird/chat';
import { useAuth } from '@/components/auth/AuthContext';
import { getSendbirdSessionToken } from '@/services/chat.service';
import { getSendbirdSdk, type SendbirdSdk } from '@/lib/sendbird/sendbirdClient';

type SendbirdStatus = 'idle' | 'connecting' | 'connected' | 'error';

interface SendbirdContextValue {
   // 연결 전/실패 시에는 null - 실시간 이벤트가 아직 없어도 REST 폴링으로 화면은 계속 동작한다
   sdk: SendbirdSdk | null;
   status: SendbirdStatus;
}

const SendbirdContext = createContext<SendbirdContextValue>({ sdk: null, status: 'idle' });

// 로그인 상태가 되면 세션 토큰을 받아 Sendbird 서버에 연결하고, 세션 만료 시 토큰을 다시
// 발급받아 SDK에 전달한다. 앱 어디서든(헤더 배지 포함) 같은 연결을 재사용하도록 레이아웃
// 최상단에서 한 번만 마운트한다
export default function SendbirdProvider({ children }: { children: React.ReactNode }) {
   const { isAuthenticated } = useAuth();
   const [sdk, setSdk] = useState<SendbirdSdk | null>(null);
   // 연결 시도 도중 로그아웃/재로그인이 일어나면 이전 시도의 결과를 무시하기 위한 세대 번호
   const connectionEpochRef = useRef(0);

   useEffect(() => {
      if (!isAuthenticated) {
         connectionEpochRef.current += 1;
         return;
      }

      const epoch = ++connectionEpochRef.current;

      getSendbirdSessionToken()
         .then(({ sendbirdUserId, sessionToken, appId }) => {
            if (epoch !== connectionEpochRef.current) return null;
            const instance = getSendbirdSdk(appId);
            instance.setSessionHandler(
               new SessionHandler({
                  onSessionTokenRequired: (resolve, reject) => {
                     getSendbirdSessionToken()
                        .then((data) => resolve(data.sessionToken))
                        .catch((err) =>
                           reject(err instanceof Error ? err : new Error('세션 토큰 갱신 실패')),
                        );
                  },
                  onSessionError: (err) => {
                     console.error('[Sendbird] 세션 오류', err);
                  },
               }),
            );
            return instance.connect(sendbirdUserId, sessionToken).then(() => instance);
         })
         .then((instance) => {
            if (!instance || epoch !== connectionEpochRef.current) return;
            setSdk(instance);
         })
         .catch((err) => {
            if (epoch !== connectionEpochRef.current) return;
            console.error('[Sendbird] 연결 실패', err);
         });
   }, [isAuthenticated]);

   // 로그아웃하면 기존 연결을 정리한다 (sdk를 null로 되돌리는 건 아래 value 계산에서 처리)
   useEffect(() => {
      if (isAuthenticated || !sdk) return;
      sdk.disconnect().catch(() => {});
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [isAuthenticated]);

   const value = useMemo<SendbirdContextValue>(() => {
      if (!isAuthenticated) return { sdk: null, status: 'idle' };
      return { sdk, status: sdk ? 'connected' : 'connecting' };
   }, [isAuthenticated, sdk]);

   return <SendbirdContext.Provider value={value}>{children}</SendbirdContext.Provider>;
}

export function useSendbird() {
   return useContext(SendbirdContext);
}
