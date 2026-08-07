'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import SearchInput from '@/components/ui/SearchInput';
import DirectChatListItem from './DirectChatListItem';
import GroupChatListItem from './GroupChatListItem';
import type { ChatChannel } from '@/services/chat.service';

interface ChatRoomListProps {
   channels: ChatChannel[];
   isLoading: boolean;
   onSelectRoom: (room: ChatChannel) => void;
}

type Tab = 'direct' | 'group';

export default function ChatRoomList({ channels, isLoading, onSelectRoom }: ChatRoomListProps) {
   const [tab, setTab] = useState<Tab>('direct');
   const [query, setQuery] = useState('');

   const directRooms = channels.filter((room) => room.channelType === 'DM');
   const groupRooms = channels.filter((room) => room.channelType === 'GROUP');

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
                  { key: 'direct', label: '1 대 1 채팅방' },
                  { key: 'group', label: '단체 채팅방' },
               ] as const
            ).map((item) => (
               <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                     setTab(item.key);
                     setQuery('');
                  }}
                  className={cn(
                     'flex-1 cursor-pointer border-b-2 py-3 text-sm font-medium',
                     tab === item.key
                        ? 'border-gray-900 text-gray-900'
                        : 'border-transparent text-gray-400',
                  )}
               >
                  {item.label}
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
               <p className="p-6 text-center text-sm text-gray-400">불러오는 중...</p>
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
