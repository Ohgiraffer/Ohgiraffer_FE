export interface ChatMessage {
   id: string; // sendbirdMessageId
   senderId: number;
   senderName: string;
   content: string;
   sentAt: string; // 화면 표시용 'HH:mm'
   isMine: boolean;
   isRead: boolean;
   isDeleted?: boolean;
   // 백엔드 응답에 원본 메시지 참조 필드가 없어, 이번 세션에서 내가 답장으로 보낸 경우에만 채워진다
   replyToPreview?: { senderName: string; content: string };
}

export interface ChatMentionUser {
   id: number;
   name: string;
   roleLabel: string;
}
