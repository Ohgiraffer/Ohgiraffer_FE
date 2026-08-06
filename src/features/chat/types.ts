export type ChatRole = '훈련생' | '강사' | '매니저';

export interface ChatUser {
   id: string;
   name: string;
   role: ChatRole;
   email: string;
   isOnline: boolean;
}

export interface ChatMessage {
   id: string;
   senderId: string; // 내가 보낸 메시지는 'me'
   senderName: string;
   content: string;
   sentAt: string; // 'HH:mm'
   isMine: boolean;
   isRead: boolean;
}

export interface DirectChatRoom {
   id: string;
   type: 'direct';
   partner: ChatUser;
   lastMessage?: string;
   lastMessageAt?: string;
   unreadCount?: number;
}

export interface GroupChatRoom {
   id: string;
   type: 'group';
   name: string;
   memberCount: number;
   lastMessage: string;
   lastMessageAt: string;
   unreadCount: number;
}

export type ChatRoom = DirectChatRoom | GroupChatRoom;
