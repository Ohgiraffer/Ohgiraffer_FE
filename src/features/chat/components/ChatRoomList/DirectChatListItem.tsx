import ChatAvatar from '../ChatAvatar';
import ChatListItem from './ChatListItem';
import type { ChatChannel } from '@/services/chat.service';

interface DirectChatListItemProps {
   room: ChatChannel;
   onClick: () => void;
}

export default function DirectChatListItem({ room, onClick }: DirectChatListItemProps) {
   // 채널 목록 응답엔 상대방 userId가 없어 온라인 표시를 못 띈다 (대화방 안에서는 채널 상세로 가능)
   return (
      <ChatListItem
         avatar={<ChatAvatar name={room.name} />}
         title={room.name}
         timestamp={room.lastMessageSentAt ?? undefined}
         preview={room.lastMessageContent ?? undefined}
         unreadCount={room.unreadCount}
         onClick={onClick}
      />
   );
}
