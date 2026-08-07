import { format } from 'date-fns';
import type { ChatMessageDto } from '@/services/chat.service';
import type { ChatMessage } from './types';

interface MapMessageContext {
   currentUserId: number;
   currentUserName: string;
   // DM 채널이면 상대방 이름 — GROUP 채널은 발신자 이름을 알 방법이 없어 대체 문구를 쓴다
   partnerName?: string;
}

export function mapMessageDto(dto: ChatMessageDto, ctx: MapMessageContext): ChatMessage {
   const isMine = dto.senderId === ctx.currentUserId;
   return {
      id: dto.sendbirdMessageId,
      senderId: dto.senderId,
      senderName: isMine ? ctx.currentUserName : (ctx.partnerName ?? '참여자'),
      content: dto.content ?? (dto.attachmentUrl ? '(첨부파일)' : ''),
      sentAt: format(new Date(dto.sentAt), 'HH:mm'),
      isMine,
      // 메시지 단위 읽음 확인 API가 없어, 내가 보낸 메시지는 일단 전송 완료 = 읽음으로 표시한다
      isRead: isMine,
   };
}
