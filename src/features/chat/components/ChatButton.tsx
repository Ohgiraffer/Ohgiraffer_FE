'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import ChatPanel from './ChatPanel';
import { useChatChannels } from '../hooks/useChatChannels';

export default function ChatButton() {
   const [isOpen, setIsOpen] = useState(false);
   const [isClosing, setIsClosing] = useState(false);
   const { channels } = useChatChannels();
   const totalUnread = channels.reduce((sum, channel) => sum + channel.unreadCount, 0);

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
