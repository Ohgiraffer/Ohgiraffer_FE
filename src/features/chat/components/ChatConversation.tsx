'use client';

import { useState } from 'react';
import { ChevronLeft, Paperclip, Send, X } from 'lucide-react';
import ChatMessageBubble from './ChatMessageBubble';
import type { ChatMessage, ChatRoom } from '../types';

interface ChatConversationProps {
   room: ChatRoom;
   messages: ChatMessage[];
   onSendMessage: (content: string) => void;
   onBack: () => void;
   onClose: () => void;
}

export default function ChatConversation({
   room,
   messages,
   onSendMessage,
   onBack,
   onClose,
}: ChatConversationProps) {
   const [draft, setDraft] = useState('');

   const title = room.type === 'direct' ? room.partner.name : room.name;
   const subtitle = room.type === 'direct' ? '1:1 채팅' : '단체 채팅';

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const content = draft.trim();
      if (!content) return;
      onSendMessage(content);
      setDraft('');
   };

   return (
      <div className="flex h-full flex-col">
         <div className="flex items-center gap-2 border-b border-gray-200 p-4">
            <button
               type="button"
               onClick={onBack}
               aria-label="목록으로"
               className="cursor-pointer rounded-xs p-1 text-gray-500 hover:bg-gray-100"
            >
               <ChevronLeft size={18} />
            </button>
            <div className="min-w-0 flex-1">
               <p className="truncate text-sm font-bold text-gray-900">{title}</p>
               <p className="text-xs text-gray-400">{subtitle}</p>
            </div>
            <button
               type="button"
               onClick={onClose}
               aria-label="닫기"
               className="cursor-pointer rounded-xs p-1 text-gray-400 hover:bg-gray-100"
            >
               <X size={18} />
            </button>
         </div>

         <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            {messages.map((message, index) => {
               const prev = messages[index - 1];
               const showSenderName = !prev || prev.senderId !== message.senderId;
               return (
                  <ChatMessageBubble key={message.id} message={message} showSenderName={showSenderName} />
               );
            })}
         </div>

         <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-gray-200 p-3">
            <button
               type="button"
               aria-label="파일 첨부"
               className="shrink-0 cursor-pointer rounded-xs p-2 text-gray-400 hover:bg-gray-100"
            >
               <Paperclip size={18} />
            </button>
            <input
               value={draft}
               onChange={(e) => setDraft(e.target.value)}
               placeholder="메시지를 입력하세요."
               className="h-10 flex-1 rounded-sm border border-gray-200 px-3 text-sm text-gray-900 outline-none focus:border-gray-400"
            />
            <button
               type="submit"
               disabled={!draft.trim()}
               aria-label="전송"
               className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-sm bg-brand-green text-white transition-colors hover:bg-[#4D655A] disabled:cursor-not-allowed disabled:bg-gray-200"
            >
               <Send size={16} />
            </button>
         </form>
      </div>
   );
}
