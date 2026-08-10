import ChatAvatar from '../ChatAvatar';
import ChatListItem from './ChatListItem';
import { formatChatTimestamp } from '../../formatChatTimestamp';
import type { ChatChannel } from '@/services/chat.service';

interface DirectChatListItemProps {
   room: ChatChannel;
   onClick: () => void;
}

export default function DirectChatListItem({ room, onClick }: DirectChatListItemProps) {
   return (
      <ChatListItem
         avatar={
            <ChatAvatar name={room.name} imageUrl={room.profileImageUrl} isOnline={!!room.isOnline} />
         }
         title={room.name}
         timestamp={room.lastMessageSentAt ? formatChatTimestamp(room.lastMessageSentAt) : undefined}
         preview={room.lastMessageContent ?? undefined}
         unreadCount={room.unreadCount}
         onClick={onClick}
      />
   );
}
