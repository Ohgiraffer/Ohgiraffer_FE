'use client';

import dynamic from 'next/dynamic';

// 루트 레이아웃(로그인 페이지 포함 전 라우트)에 항상 떠 있는 위젯이라 지연 로딩한다.
// 루트 레이아웃은 서버 컴포넌트라 next/dynamic(ssr:false)을 직접 못 써서, 이 클라이언트
// 래퍼를 통해서만 감싼다
const AIAssistantWidget = dynamic(() => import('./AIAssistantWidget'), { ssr: false });

export default function AIAssistantWidgetLoader() {
   return <AIAssistantWidget />;
}
