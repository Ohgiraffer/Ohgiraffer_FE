import ChatAvatar from './ChatAvatar';
import ChatListItem from './ChatListItem';
import type { DirectChatRoom } from '../types';

interface DirectChatListItemProps {
   room: DirectChatRoom;
   onClick: () => void;
}

export default function DirectChatListItem({ room, onClick }: DirectChatListItemProps) {
   return (
      <ChatListItem
         avatar={<ChatAvatar name={room.partner.name} isOnline={room.partner.isOnline} />}
         title={room.partner.name}
         timestamp={room.lastMessageAt}
         preview={room.lastMessage}
         unreadCount={room.unreadCount}
         onClick={onClick}
      />
   );
}
