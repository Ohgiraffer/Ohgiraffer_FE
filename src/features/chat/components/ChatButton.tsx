'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import ChatPanel from './ChatPanel';
import { useChatChannels } from '../hooks/useChatChannels';
import { useUnreadCount } from '../hooks/useUnreadCount';

export default function ChatButton() {
   const [isOpen, setIsOpen] = useState(false);
   const [isClosing, setIsClosing] = useState(false);
   // 헤더 배지와 패널이 같은 값을 보도록 여기서 한 번만 조회해 아래로 내려준다.
   // 각자 따로 조회하면(예전 구조) 두 배지가 서로 다른 시점의 값을 보여줄 수 있었다
   const { channels, isLoading: isLoadingChannels, reload: reloadChannels } = useChatChannels();
   const { totalUnreadCount } = useUnreadCount();

   const handleToggle = () => {
      if (isOpen) {
         setIsClosing(true);
      } else {
         setIsOpen(true);
      }
   };

   const requestClose = () => setIsClosing(true);

   const handleClosed = () => {
      setIsOpen(false);
      setIsClosing(false);
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

         {isOpen && (
            <ChatPanel
               isClosing={isClosing}
               onClose={requestClose}
               onClosed={handleClosed}
               channels={channels}
               isLoadingChannels={isLoadingChannels}
               reloadChannels={reloadChannels}
               totalUnreadCount={totalUnreadCount}
            />
         )}
      </>
   );
}
