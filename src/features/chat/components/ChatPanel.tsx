'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import ChatRoomList from './ChatRoomList';
import ChatConversation from './ChatConversation';
import NewChatModal from './NewChatModal';
import { CHAT_USERS, DUMMY_MESSAGES, GROUP_ROOMS } from '../dummyData';
import type { ChatMessage, ChatRoom } from '../types';

interface ChatPanelProps {
   onClose: () => void;
   // 닫힘 애니메이션이 재생되는 동안 true
   isClosing: boolean;
   // 닫힘 애니메이션이 끝난 뒤 실제로 언마운트해도 된다는 신호
   onClosed: () => void;
}

export default function ChatPanel({ onClose, isClosing, onClosed }: ChatPanelProps) {
   const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
   const [isNewChatOpen, setIsNewChatOpen] = useState(false);
   const [messagesByRoom, setMessagesByRoom] = useState<Record<string, ChatMessage[]>>(DUMMY_MESSAGES);

   const totalUnread = GROUP_ROOMS.reduce((sum, room) => sum + room.unreadCount, 0);

   // 패널이 떠 있는 동안(닫힘 애니메이션 재생 중까지) 배경 페이지 스크롤을 잠가서,
   // 채팅 목록 스크롤바와 페이지 스크롤바가 나란히 붙어 보이는 이중 스크롤을 없앤다
   useEffect(() => {
      // overflow:hidden으로 스크롤바가 사라지면 콘텐츠 너비가 스크롤바 폭만큼 늘어나며
      // 덜컹거린다 (scrollbar-gutter로는 overflow:hidden 상태에서 자리가 안 잡혀 별 효과가 없었음).
      // 스크롤바 폭을 직접 재서 그만큼 padding-right로 보정해준다.
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.paddingRight = `${scrollbarWidth}px`;
      return () => {
         document.documentElement.style.overflow = '';
         document.documentElement.style.paddingRight = '';
      };
   }, []);

   const handleSendMessage = (roomId: string, content: string) => {
      const message: ChatMessage = {
         id: crypto.randomUUID(),
         senderId: 'me',
         senderName: '나',
         content,
         sentAt: new Intl.DateTimeFormat('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
         }).format(new Date()),
         isMine: true,
         isRead: false,
      };
      setMessagesByRoom((prev) => ({ ...prev, [roomId]: [...(prev[roomId] ?? []), message] }));
   };

   const handleCreateRoom = ({ memberIds, name }: { memberIds: string[]; name?: string }) => {
      if (memberIds.length === 1) {
         const partner = CHAT_USERS.find((user) => user.id === memberIds[0]);
         if (!partner) return;
         setActiveRoom({ id: `direct-${partner.id}`, type: 'direct', partner });
      } else {
         const memberNames = memberIds
            .map((id) => CHAT_USERS.find((user) => user.id === id)?.name)
            .filter(Boolean)
            .join(', ');
         setActiveRoom({
            id: `group-${crypto.randomUUID()}`,
            type: 'group',
            name: name || memberNames,
            memberCount: memberIds.length + 1,
            lastMessage: '',
            lastMessageAt: '',
            unreadCount: 0,
         });
      }
      setIsNewChatOpen(false);
   };

   return (
      // 헤더(h-14) 영역은 아예 포함하지 않는다 - 예전엔 fixed inset-0로 화면 전체를 덮어서,
      // 눈에는 안 보여도 헤더의 채팅 버튼 클릭이 이 투명 오버레이에 막혀 토글이 안 됐었다
      <div className="fixed inset-x-0 top-14 bottom-0 z-60">
         <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-[250ms] ease-out ${
               isClosing ? 'opacity-0' : 'opacity-100'
            }`}
            onClick={onClose}
         />
         <div
            onAnimationEnd={() => {
               if (isClosing) onClosed();
            }}
            className={`absolute top-0 right-0 bottom-0 flex w-105 flex-col bg-white ${
               isClosing ? 'animate-slide-out-right' : 'animate-slide-in-right'
            }`}
         >
            {activeRoom ? (
               <ChatConversation
                  room={activeRoom}
                  messages={messagesByRoom[activeRoom.id] ?? []}
                  onSendMessage={(content) => handleSendMessage(activeRoom.id, content)}
                  onBack={() => setActiveRoom(null)}
                  onClose={onClose}
               />
            ) : (
               <>
                  <div className="flex items-center justify-between p-5 pb-4">
                     <span className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-gray-900">채팅</h2>
                        {totalUnread > 0 && (
                           <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-green px-1 text-[11px] leading-none font-medium text-white">
                              {totalUnread}
                           </span>
                        )}
                     </span>
                     <button
                        type="button"
                        onClick={() => setIsNewChatOpen(true)}
                        className="flex cursor-pointer items-center gap-1 rounded-xs border border-brand-green bg-white px-3 py-1.5 text-xs font-medium text-brand-green hover:bg-gray-50"
                     >
                        <Plus size={14} />새 채팅
                     </button>
                  </div>

                  <ChatRoomList onSelectRoom={setActiveRoom} />
               </>
            )}

            {isNewChatOpen && (
               <NewChatModal onClose={() => setIsNewChatOpen(false)} onCreate={handleCreateRoom} />
            )}
         </div>
      </div>
   );
}
