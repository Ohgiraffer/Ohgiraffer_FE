'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { MessageSquare } from 'lucide-react';
import { useChatChannels } from '../hooks/useChatChannels';
import { useUnreadCount } from '../hooks/useUnreadCount';
import { useSidePanel } from '@/components/layout/SidePanelContext';

// 채팅 화면(방 목록/대화/스레드) 전체가 무거우니, 배지와 별개로 실제로 패널을 열기 전까지는
// 이 청크를 아예 받지 않는다
const ChatPanel = dynamic(() => import('./ChatPanel'), { ssr: false });

export default function ChatButton() {
   // 알림/공간관리 등 다른 우측 패널이 열려 있으면 채팅을 열 때 자동으로 닫히도록 공용 상태로 관리
   const { isOpen, toggle, close } = useSidePanel('chat');
   // 헤더 배지와 패널이 같은 값을 보도록 여기서 한 번만 조회해 아래로 내려준다.
   // 각자 따로 조회하면(예전 구조) 두 배지가 서로 다른 시점의 값을 보여줄 수 있었다
   const { channels, isLoading: isLoadingChannels, reload: reloadChannels } = useChatChannels();
   const { totalUnreadCount, reload: reloadUnreadCount } = useUnreadCount();
   // ChatPanel은 처음 열 때 한 번만 마운트하고, 그 뒤로는 닫아도 계속 마운트해둔다(재요청 방지 +
   // SidePanelShell의 퇴장 애니메이션과 대화방 상태가 다음에 열 때도 유지되도록)
   const [hasOpenedOnce, setHasOpenedOnce] = useState(false);

   const handleToggle = () => {
      if (!hasOpenedOnce) setHasOpenedOnce(true);
      toggle();
   };

   return (
      <>
         <button
            type="button"
            onClick={handleToggle}
            aria-label="채팅"
            className={`relative cursor-pointer rounded-xs p-2 transition-colors hover:bg-[#4D655A] ${
               isOpen ? 'bg-[#4D655A]' : ''
            }`}
         >
            <MessageSquare size={18} />
            {totalUnreadCount > 0 && (
               <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FFEEAF] px-1 text-[10px] leading-none font-medium text-black">
                  {totalUnreadCount}
               </span>
            )}
         </button>

         {hasOpenedOnce && (
            <ChatPanel
               open={isOpen}
               onClose={close}
               channels={channels}
               isLoadingChannels={isLoadingChannels}
               reloadChannels={reloadChannels}
               totalUnreadCount={totalUnreadCount}
               reloadUnreadCount={reloadUnreadCount}
            />
         )}
      </>
   );
}
