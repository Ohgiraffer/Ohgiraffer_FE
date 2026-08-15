'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/components/auth/AuthContext';
import type { SendbirdSdk } from '@/lib/sendbird/sendbirdClient';

type SendbirdStatus = 'idle' | 'connecting' | 'connected' | 'error';

interface SendbirdContextValue {
   // 연결 전/실패 시에는 null - 실시간 이벤트가 아직 없어도 REST 폴링으로 화면은 계속 동작한다
   sdk: SendbirdSdk | null;
   status: SendbirdStatus;
}

const SendbirdContext = createContext<SendbirdContextValue>({ sdk: null, status: 'idle' });

// 실제 연결 로직(@sendbird/chat)은 무거우니 별도 컴포넌트로 분리해 next/dynamic(ssr:false)로
// 불러온다 - null만 렌더하는 컴포넌트라 children을 가리지 않으면서도, 서버 번들과 초기
// 클라이언트 파싱 양쪽에서 완전히 제외된다
const SendbirdConnector = dynamic(() => import('./SendbirdConnector'), { ssr: false });

// 로그인 상태가 되면 세션 토큰을 받아 Sendbird 서버에 연결하고, 세션 만료 시 토큰을 다시
// 발급받아 SDK에 전달한다. 앱 어디서든(헤더 배지 포함) 같은 연결을 재사용하도록 레이아웃
// 최상단에서 한 번만 마운트한다
export default function SendbirdProvider({ children }: { children: React.ReactNode }) {
   const { isAuthenticated } = useAuth();
   const [sdk, setSdk] = useState<SendbirdSdk | null>(null);

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

   return (
      <SendbirdContext.Provider value={value}>
         <SendbirdConnector isAuthenticated={isAuthenticated} onSdkChange={setSdk} />
         {children}
      </SendbirdContext.Provider>
   );
}

export function useSendbird() {
   return useContext(SendbirdContext);
}
