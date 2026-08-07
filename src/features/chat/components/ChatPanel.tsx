'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import ChatRoomList from './ChatRoomList/ChatRoomList';
import ChatConversation from './ChatConversation/ChatConversation';
import NewChatModal from './ChatRoomList/NewChatModal';
import ThreadPanel from './ChatConversation/ThreadPanel';
import { useChatChannels } from '../hooks/useChatChannels';
import { useScrollLock } from '@/hooks/useScrollLock';
import { createChannel, type ChatChannel } from '@/services/chat.service';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import type { ChatMessage } from '../types';

interface ChatPanelProps {
   onClose: () => void;
   // 닫힘 애니메이션이 재생되는 동안 true
   isClosing: boolean;
   // 닫힘 애니메이션이 끝난 뒤 실제로 언마운트해도 된다는 신호
   onClosed: () => void;
}

export default function ChatPanel({ onClose, isClosing, onClosed }: ChatPanelProps) {
   const [activeRoom, setActiveRoom] = useState<ChatChannel | null>(null);
   const [isNewChatOpen, setIsNewChatOpen] = useState(false);
   const [threadRoot, setThreadRoot] = useState<ChatMessage | null>(null);
   // 답글 수 필드가 백엔드 응답에 없어, 이번 세션에서 파악된(직접 답장했거나 스레드를 열어본) 만큼만 기록한다
   const [replyCounts, setReplyCounts] = useState<Record<string, number>>({});
   const { channels, isLoading, reload } = useChatChannels();

   const totalUnread = channels.reduce((sum, channel) => sum + channel.unreadCount, 0);

   // 패널이 떠 있는 동안(닫힘 애니메이션 재생 중까지) 배경 페이지 스크롤을 잠가서,
   // 채팅 목록 스크롤바와 페이지 스크롤바가 나란히 붙어 보이는 이중 스크롤을 없앤다
   useScrollLock();

   const handleSelectRoom = (room: ChatChannel) => {
      setThreadRoot(null);
      setReplyCounts({});
      setActiveRoom(room);
   };

   const handleBack = () => {
      setThreadRoot(null);
      setReplyCounts({});
      setActiveRoom(null);
   };

   const handleReplySent = (rootId: string) => {
      setReplyCounts((prev) => ({ ...prev, [rootId]: (prev[rootId] ?? 0) + 1 }));
   };

   const handleCreateRoom = async ({ userIds, name }: { userIds: number[]; name?: string }) => {
      try {
         const created = await createChannel(userIds, name);
         handleSelectRoom({
            channelId: created.channelId,
            name: created.name,
            channelType: userIds.length >= 2 ? 'GROUP' : 'DM',
            lastMessageContent: null,
            lastMessageSentAt: null,
            unreadCount: 0,
         });
         setIsNewChatOpen(false);
         reload();
      } catch (err) {
         // 이미 같은 상대와의 1:1 채팅방이 있으면 새로 만들지 않고 그 방을 그대로 연다
         if (err instanceof ApiError && err.status === 409 && typeof err.data?.channelId === 'string') {
            handleSelectRoom({
               channelId: err.data.channelId,
               name: name ?? '',
               channelType: 'DM',
               lastMessageContent: null,
               lastMessageSentAt: null,
               unreadCount: 0,
            });
            setIsNewChatOpen(false);
            return;
         }
         toast.error(
            err instanceof ApiError
               ? err.message
               : '채팅방을 만들지 못했습니다. 잠시 후 다시 시도해주세요.',
         );
      }
   };

   return (
      <div className="fixed inset-x-0 top-14 bottom-0 z-60">
         <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-250 ease-out ${
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
                  key={activeRoom.channelId}
                  room={activeRoom}
                  replyCounts={replyCounts}
                  onReplySent={handleReplySent}
                  onOpenThread={setThreadRoot}
                  onBack={handleBack}
                  onClose={onClose}
               />
            ) : (
               <>
                  <div className="flex items-center justify-between p-5 pb-4">
                     <span className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-gray-900">채팅</h2>
                        {totalUnread > 0 && (
                           <span className="flex h-5 min-w-5 items-center justify-center rounded-xs bg-brand-green px-1 text-[11px] font-medium text-white">
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

                  <ChatRoomList channels={channels} isLoading={isLoading} onSelectRoom={handleSelectRoom} />
               </>
            )}

            {isNewChatOpen && (
               <NewChatModal onClose={() => setIsNewChatOpen(false)} onCreate={handleCreateRoom} />
            )}
         </div>

         {activeRoom && threadRoot && (
            <ThreadPanel
               key={threadRoot.id}
               room={activeRoom}
               rootMessage={threadRoot}
               onClose={() => setThreadRoot(null)}
               onReplySent={handleReplySent}
            />
         )}
      </div>
   );
}
