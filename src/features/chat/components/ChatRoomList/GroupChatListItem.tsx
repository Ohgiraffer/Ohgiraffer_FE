import { Users } from 'lucide-react';
import ChatListItem from './ChatListItem';
import { formatChatTimestamp } from '../../formatChatTimestamp';
import type { ChatChannel } from '@/services/chat.service';

interface GroupChatListItemProps {
   room: ChatChannel;
   onClick: () => void;
}

export default function GroupChatListItem({ room, onClick }: GroupChatListItemProps) {
   return (
      <ChatListItem
         avatar={
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-sage/10 text-gray-500">
               <Users size={22} />
            </span>
         }
         title={room.name}
         timestamp={room.lastMessageSentAt ? formatChatTimestamp(room.lastMessageSentAt) : undefined}
         preview={room.lastMessageContent ?? undefined}
         unreadCount={room.unreadCount}
         onClick={onClick}
      />
   );
}
