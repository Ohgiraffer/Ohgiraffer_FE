'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 앱 전역에서 서버 상태(GET 응답)를 캐싱하는 계층. 컨벤션:
// - staleTime 기본 5분: 조직/사용자/팀 목록처럼 자주 안 바뀌는 데이터에 맞춘 기본값이고,
//   실시간성이 필요한 화면(알림/채팅/결재 대기 등)은 각 훅에서 staleTime을 0으로 개별 지정한다
// - refetchOnWindowFocus는 끔: 사내 관리 툴 특성상 탭을 왔다갔다 할 때마다 재조회할 필요가 없다
// - 쿼리 키는 ['도메인', '세부', ...파라미터] 배열 형태로 통일한다 (예: ['users', 'list'])
export default function QueryProvider({ children }: { children: React.ReactNode }) {
   const [queryClient] = useState(
      () =>
         new QueryClient({
            defaultOptions: {
               queries: {
                  staleTime: 5 * 60 * 1000,
                  refetchOnWindowFocus: false,
                  retry: 1,
               },
            },
         }),
   );

   return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
