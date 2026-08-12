'use client';

import { createContext, useCallback, useContext, useState } from 'react';

// 알림/채팅/공간관리처럼 헤더 아래에 뜨는 우측 슬라이드 패널들이 동시에 두 개 이상 겹쳐 열리지
// 않도록, 지금 열려 있는 패널이 무엇인지를 여기 하나로만 관리한다 - 다른 패널을 열면 자동으로 닫힘
export type SidePanelId = 'notification' | 'chat' | 'space-manage';

interface SidePanelContextValue {
   activePanel: SidePanelId | null;
   openPanel: (id: SidePanelId) => void;
   closePanel: (id: SidePanelId) => void;
   togglePanel: (id: SidePanelId) => void;
}

const SidePanelContext = createContext<SidePanelContextValue | null>(null);

export function SidePanelProvider({ children }: { children: React.ReactNode }) {
   const [activePanel, setActivePanel] = useState<SidePanelId | null>(null);

   const openPanel = useCallback((id: SidePanelId) => setActivePanel(id), []);
   // 이미 다른 패널이 열려 activePanel이 바뀐 뒤라면(예: A가 닫히기 전에 B가 열림) A의 지연된
   // onClose가 B까지 닫아버리면 안 되므로, 자신이 여전히 활성 패널일 때만 null로 되돌린다
   const closePanel = useCallback((id: SidePanelId) => {
      setActivePanel((prev) => (prev === id ? null : prev));
   }, []);
   const togglePanel = useCallback((id: SidePanelId) => {
      setActivePanel((prev) => (prev === id ? null : id));
   }, []);

   return (
      <SidePanelContext.Provider value={{ activePanel, openPanel, closePanel, togglePanel }}>
         {children}
      </SidePanelContext.Provider>
   );
}

// 패널 하나당 이 훅을 자기 id로 호출하면 그 패널 기준의 열림 상태/열기/닫기/토글을 바로 쓸 수 있다
export function useSidePanel(id: SidePanelId) {
   const ctx = useContext(SidePanelContext);
   if (!ctx) throw new Error('useSidePanel은 SidePanelProvider 안에서만 사용할 수 있습니다.');
   return {
      isOpen: ctx.activePanel === id,
      open: () => ctx.openPanel(id),
      close: () => ctx.closePanel(id),
      toggle: () => ctx.togglePanel(id),
   };
}
