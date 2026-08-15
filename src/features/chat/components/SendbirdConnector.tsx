'use client';

import { useEffect, useRef } from 'react';
import { SessionHandler } from '@sendbird/chat';
import { getSendbirdSessionToken } from '@/services/chat.service';
import { getSendbirdSdk, type SendbirdSdk } from '@/lib/sendbird/sendbirdClient';

type Props = {
   isAuthenticated: boolean;
   onSdkChange: (sdk: SendbirdSdk) => void;
};

// 실제 연결 로직 - @sendbird/chat import는 이 파일에만 있다. SendbirdProvider가 이 컴포넌트를
// next/dynamic(ssr:false)로 불러오기 때문에, 별도 처리 없이도 서버 번들과 초기 클라이언트
// 파싱 양쪽 모두에서 완전히 제외된다(Tiptap/캘린더와 동일한 방식)
export default function SendbirdConnector({ isAuthenticated, onSdkChange }: Props) {
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
            if (!instance) return;
            if (epoch !== connectionEpochRef.current) {
               // 연결이 완료되기 전에 로그아웃했거나 다른 계정으로 로그인했다면(세션이 바뀜),
               // 이 연결은 이미 못 쓰는 이전 세션 몫이다. 부모에 반영하지 않고 바로 끊는다
               instance.disconnect().catch(() => {});
               return;
            }
            onSdkChange(instance);
         })
         .catch((err) => {
            if (epoch !== connectionEpochRef.current) return;
            console.error('[Sendbird] 연결 실패', err);
         });
   }, [isAuthenticated, onSdkChange]);

   return null;
}
