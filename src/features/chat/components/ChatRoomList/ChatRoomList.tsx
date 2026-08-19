'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import SearchInput from '@/components/ui/SearchInput';
import { SkeletonListRow } from '@/components/ui/loading/Skeleton';
import DirectChatListItem from './DirectChatListItem';
import GroupChatListItem from './GroupChatListItem';
import type { ChatChannel } from '@/services/chat.service';

export type ChatRoomListTab = 'direct' | 'group';

interface ChatRoomListProps {
   channels: ChatChannel[];
   isLoading: boolean;
   onSelectRoom: (room: ChatChannel) => void;
   // 채팅방 상세에 들어갔다 뒤로 나와도 보던 탭이 유지되도록 부모(ChatPanel)가 들고 있는 상태를
   // 그대로 받아 쓴다 - 이 컴포넌트가 직접 들고 있으면 상세 화면과 목록 화면이 서로 자리를
   // 바꿔 그릴 때마다(ChatPanel의 activeRoom 분기) 매번 언마운트/재마운트되면서 초기값으로 리셋된다
   tab: ChatRoomListTab;
   onTabChange: (tab: ChatRoomListTab) => void;
}

// 최근 메시지가 있는 방이 위로 오도록 최신순 정렬 - 아직 메시지가 없는 방(lastMessageSentAt이
// null)은 맨 아래로 보낸다. ISO 8601 문자열은 사전순 비교가 곧 시간순 비교와 같다
function sortByLatestMessage(channels: ChatChannel[]) {
   return [...channels].sort((a, b) => {
      if (!a.lastMessageSentAt && !b.lastMessageSentAt) return 0;
      if (!a.lastMessageSentAt) return 1;
      if (!b.lastMessageSentAt) return -1;
      return b.lastMessageSentAt.localeCompare(a.lastMessageSentAt);
   });
}

export default function ChatRoomList({
   channels,
   isLoading,
   onSelectRoom,
   tab,
   onTabChange,
}: ChatRoomListProps) {
   const [query, setQuery] = useState('');

   const sortedChannels = useMemo(() => sortByLatestMessage(channels), [channels]);
   const directRooms = sortedChannels.filter((room) => room.channelType === 'DM');
   const groupRooms = sortedChannels.filter((room) => room.channelType === 'GROUP');

   // 탭 옆에 띄우는 안읽음 배지는 검색어로 걸러지기 전, 탭 전체 기준 합계
   const directUnreadCount = directRooms.reduce((sum, room) => sum + room.unreadCount, 0);
   const groupUnreadCount = groupRooms.reduce((sum, room) => sum + room.unreadCount, 0);

   const filteredDirectRooms = directRooms.filter((room) =>
      room.name.toLowerCase().includes(query.toLowerCase()),
   );
   const filteredGroupRooms = groupRooms.filter((room) =>
      room.name.toLowerCase().includes(query.toLowerCase()),
   );

   const activeRooms = tab === 'direct' ? filteredDirectRooms : filteredGroupRooms;

   return (
      <div className="flex min-h-0 flex-1 flex-col">
         <div className="flex border-b border-gray-200">
            {(
               [
                  { key: 'direct', label: '1 대 1 채팅방', unreadCount: directUnreadCount },
                  { key: 'group', label: '단체 채팅방', unreadCount: groupUnreadCount },
               ] as const
            ).map((item) => (
               <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                     onTabChange(item.key);
                     setQuery('');
                  }}
                  className={cn(
                     'flex flex-1 cursor-pointer items-center justify-center gap-1.5 border-b-2 py-3 text-sm font-medium',
                     tab === item.key
                        ? 'border-gray-900 text-gray-900'
                        : 'border-transparent text-gray-400',
                  )}
               >
                  {item.label}
                  {item.unreadCount > 0 && (
                     <span className="flex h-5 min-w-5 items-center justify-center rounded-xs bg-brand-green px-1 text-[11px] font-medium text-white">
                        {item.unreadCount}
                     </span>
                  )}
               </button>
            ))}
         </div>

         <div className="p-4 pb-2">
            <SearchInput
               onSearch={setQuery}
               placeholder={tab === 'direct' ? '채팅 참여자 이름으로 검색' : '채팅방 이름으로 검색'}
               className="w-full"
               heightClassName="h-9"
            />
         </div>

         <div className="flex-1 overflow-y-auto">
            {isLoading ? (
               [0, 1, 2, 3, 4].map((i) => <SkeletonListRow key={i} index={i} />)
            ) : activeRooms.length === 0 ? (
               <p className="p-6 text-center text-sm text-gray-400">
                  {tab === 'direct' ? '1:1 채팅방이 없습니다' : '단체 채팅방이 없습니다'}
               </p>
            ) : tab === 'direct' ? (
               filteredDirectRooms.map((room) => (
                  <DirectChatListItem
                     key={room.channelId}
                     room={room}
                     onClick={() => onSelectRoom(room)}
                  />
               ))
            ) : (
               filteredGroupRooms.map((room) => (
                  <GroupChatListItem
                     key={room.channelId}
                     room={room}
                     onClick={() => onSelectRoom(room)}
                  />
               ))
            )}
         </div>
      </div>
   );
}
