'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import ChatPanel from './ChatPanel';
import { GROUP_ROOMS } from '../dummyData';

export default function ChatButton() {
   const [isOpen, setIsOpen] = useState(false);
   // 패널이 실제로 사라지기 전, 닫힘 애니메이션이 재생되는 동안만 true
   const [isClosing, setIsClosing] = useState(false);
   const totalUnread = GROUP_ROOMS.reduce((sum, room) => sum + room.unreadCount, 0);

   const handleToggle = () => {
      if (isOpen) {
         setIsClosing(true);
      } else {
         setIsOpen(true);
      }
   };

   // 닫힘 애니메이션 재생을 시작만 시킨다 (실제 언마운트는 애니메이션이 끝난 뒤 handleClosed에서)
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
            {totalUnread > 0 && (
               <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FFEEAF] px-1 text-[10px] leading-none font-medium text-black">
                  {totalUnread}
               </span>
            )}
         </button>

         {isOpen && (
            <ChatPanel isClosing={isClosing} onClose={requestClose} onClosed={handleClosed} />
         )}
      </>
   );
}
