'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bot, Plus } from 'lucide-react';
import ChatRoomList from './ChatRoomList/ChatRoomList';
import ChatConversation from './ChatConversation/ChatConversation';
import NewChatModal from './ChatRoomList/NewChatModal';
import ThreadPanel from './ChatConversation/ThreadPanel';
import SidePanelShell from '@/components/ui/SidePanelShell';
import { createChannel, getChatbotChannel, type ChatChannel } from '@/services/chat.service';
import { ApiError } from '@/lib/http';
import { getChatErrorMessage } from '../chatErrors';
import { toast } from '@/lib/toast';
import type { ChatMessage } from '../types';

interface ChatPanelProps {
   open: boolean;
   onClose: () => void;
   // 헤더 배지(ChatButton)와 값이 갈라지지 않도록, 채널 목록/안읽음 수는 부모가 한 번만 조회해 내려준다
   channels: ChatChannel[];
   isLoadingChannels: boolean;
   reloadChannels: () => void;
   totalUnreadCount: number;
   reloadUnreadCount: () => void;
}

export default function ChatPanel({
   open,
   onClose,
   channels,
   isLoadingChannels,
   reloadChannels,
   totalUnreadCount,
   reloadUnreadCount,
}: ChatPanelProps) {
   const [activeRoom, setActiveRoom] = useState<ChatChannel | null>(null);
   // AI 비서 채널의 실제 channelId - 목록에서 클릭해 들어오든 상단 버튼으로 들어오든 항상 같은
   // 기준으로 "지금 연 방이 AI 비서인지"를 판단하기 위해 한 번 조회해 캐싱해둔다(버튼 클릭 시에도 갱신)
   const [botChannelId, setBotChannelId] = useState<string | null>(null);
   useEffect(() => {
      getChatbotChannel()
         .then(({ channel_url }) => setBotChannelId(channel_url))
         .catch(() => {}); // 아직 채널이 없거나 조회 실패해도 조용히 무시 - "AI 비서" 버튼 클릭 시 다시 시도된다
   }, []);
   const isChatbotRoom = activeRoom !== null && activeRoom.channelId === botChannelId;
   const [isNewChatOpen, setIsNewChatOpen] = useState(false);
   const [threadRoot, setThreadRoot] = useState<ChatMessage | null>(null);
   // 방을 열 때 서버에서 실제 답글 수를 받아와 채우고(handleReplyCountsLoaded), 그 이후 이번
   // 세션에서 직접 보낸 답글만 로컬로 증가시킨다(handleReplySent) - 매번 다시 조회하진 않는다
   const [replyCounts, setReplyCounts] = useState<Record<string, number>>({});
   // 스레드에서 루트 메시지를 수정/삭제하면 여기에 최신 메시지를 담아 ChatConversation에도 반영시킨다.
   // 방을 바꾸면(handleSelectRoom/handleBack) 다른 방의 낡은 patch가 새 방에 잘못 적용되지 않도록 비운다
   const [rootPatch, setRootPatch] = useState<ChatMessage | null>(null);

   const handleSelectRoom = (room: ChatChannel) => {
      setThreadRoot(null);
      setReplyCounts({});
      setRootPatch(null);
      setActiveRoom(room);
   };

   const handleBack = () => {
      setThreadRoot(null);
      setReplyCounts({});
      setRootPatch(null);
      setActiveRoom(null);
   };

   const handleReplySent = (rootId: string) => {
      setReplyCounts((prev) => ({ ...prev, [rootId]: (prev[rootId] ?? 0) + 1 }));
   };

   // 서버에서 막 받아온 값으로 채우되, 그 사이 로컬에서 이미 늘려둔 값(막 보낸 답글)이 있으면 유지한다
   const handleReplyCountsLoaded = useCallback((counts: Record<string, number>) => {
      setReplyCounts((prev) => ({ ...counts, ...prev }));
   }, []);

   // 서버는 메시지 조회 시점에 읽음 처리를 하므로, 채널에 들어가 메시지를 불러온 직후
   // 안읽음 배지가 다음 폴링(최대 20초)까지 낡은 값을 보여주지 않도록 바로 다시 조회한다.
   // reloadChannels/reloadUnreadCount는 각 훅에서 이미 안정된 참조라, 이 함수도 useCallback으로
   // 고정해둬야 ChatConversation의 폴링 effect가 매 렌더마다 재시작되지 않는다
   const handleMessagesRead = useCallback(() => {
      reloadChannels();
      reloadUnreadCount();
   }, [reloadChannels, reloadUnreadCount]);

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
            profileImageUrl: null,
            isOnline: null,
         });
         setIsNewChatOpen(false);
         reloadChannels();
      } catch (err) {
         // 이미 같은 상대와의 1:1 채팅방이 있으면 새로 만들지 않고 그 방을 그대로 상세 조회
         if (err instanceof ApiError && err.status === 409 && typeof err.data?.channelId === 'string') {
            handleSelectRoom({
               channelId: err.data.channelId,
               name: name ?? '',
               channelType: 'DM',
               lastMessageContent: null,
               lastMessageSentAt: null,
               unreadCount: 0,
               profileImageUrl: null,
               isOnline: null,
            });
            setIsNewChatOpen(false);
            return;
         }
         toast.error(getChatErrorMessage(err, '채팅방을 만들지 못했습니다. 잠시 후 다시 시도해주세요.'));
      }
   };

   // 백엔드가 미리 만들어둔 사용자-AI 비서 채널을 열기만 하면 되므로, 다른 방과 달리
   // 목록에 없어도 channel_url만 받아 바로 handleSelectRoom으로 진입시킨다
   const handleOpenChatbot = async () => {
      try {
         const { channel_url: channelUrl } = await getChatbotChannel();
         setBotChannelId(channelUrl);
         handleSelectRoom({
            channelId: channelUrl,
            name: 'AI 비서',
            channelType: 'DM',
            lastMessageContent: null,
            lastMessageSentAt: null,
            unreadCount: 0,
            profileImageUrl: null,
            isOnline: null,
         });
      } catch (err) {
         toast.error(getChatErrorMessage(err, 'AI 비서 채널을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'));
      }
   };

   return (
      <SidePanelShell
         open={open}
         onClose={onClose}
         labelledBy="chat-panel-title"
         overlayExtra={
            activeRoom &&
            threadRoot && (
               <ThreadPanel
                  key={threadRoot.id}
                  room={activeRoom}
                  rootMessage={threadRoot}
                  onClose={() => setThreadRoot(null)}
                  onReplySent={handleReplySent}
                  onRootMessageChange={setRootPatch}
               />
            )
         }
      >
         {activeRoom ? (
            <ChatConversation
               key={activeRoom.channelId}
               room={activeRoom}
               isChatbot={isChatbotRoom}
               replyCounts={replyCounts}
               onReplySent={handleReplySent}
               onOpenThread={setThreadRoot}
               onBack={handleBack}
               incomingMessagePatch={rootPatch}
               onMessagesRead={handleMessagesRead}
               onReplyCountsLoaded={handleReplyCountsLoaded}
            />
         ) : (
            <>
               <div className="flex items-center justify-between p-5 pb-4">
                  <span className="flex items-center gap-2">
                     <h2 id="chat-panel-title" className="text-xl font-bold text-gray-900">
                        채팅
                     </h2>
                     {totalUnreadCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-xs bg-brand-green px-1 text-[11px] font-medium text-white">
                           {totalUnreadCount}
                        </span>
                     )}
                  </span>
                  <div className="flex items-center gap-1.5">
                     <button
                        type="button"
                        onClick={handleOpenChatbot}
                        className="flex cursor-pointer items-center gap-1 rounded-xs border border-brand-green bg-brand-green px-3 py-1.5 text-xs font-medium text-white hover:bg-[#4D655A]"
                     >
                        <Bot size={14} />
                        AI 비서
                     </button>
                     <button
                        type="button"
                        onClick={() => setIsNewChatOpen(true)}
                        className="flex cursor-pointer items-center gap-1 rounded-xs border border-brand-green bg-white px-3 py-1.5 text-xs font-medium text-brand-green hover:bg-gray-50"
                     >
                        <Plus size={14} />새 채팅
                     </button>
                  </div>
               </div>

               <ChatRoomList
                  channels={channels}
                  isLoading={isLoadingChannels}
                  onSelectRoom={handleSelectRoom}
               />
            </>
         )}

         {isNewChatOpen && (
            <NewChatModal onClose={() => setIsNewChatOpen(false)} onCreate={handleCreateRoom} />
         )}
      </SidePanelShell>
   );
}
