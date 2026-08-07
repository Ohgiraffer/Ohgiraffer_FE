import { Users } from 'lucide-react';
import ChatListItem from './ChatListItem';
import type { ChatChannel } from '@/services/chat.service';

interface GroupChatListItemProps {
   room: ChatChannel;
   onClick: () => void;
}

export default function GroupChatListItem({ room, onClick }: GroupChatListItemProps) {
   return (
      <ChatListItem
         avatar={
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400">
               <Users size={18} />
            </span>
         }
         title={room.name}
         timestamp={room.lastMessageSentAt ?? undefined}
         preview={room.lastMessageContent ?? undefined}
         unreadCount={room.unreadCount}
         onClick={onClick}
      />
   );
}
