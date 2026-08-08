import { format, isValid } from 'date-fns';
import type { ChatChannelMember, ChatMessageDto } from '@/services/chat.service';
import type { ChatMessage } from './types';

interface MapMessageContext {
   currentUserId: number;
   currentUserName: string;
   // 채널 상세(getChannelDetail) 조회로 얻은 멤버 목록 - DM/GROUP 모두 여기서 발신자 이름을 찾기
   members: ChatChannelMember[];
}

export function mapMessageDto(dto: ChatMessageDto, ctx: MapMessageContext): ChatMessage {
   const isMine = dto.senderId === ctx.currentUserId;
   const senderName = isMine
      ? ctx.currentUserName
      : ctx.members.find((member) => member.userId === dto.senderId)?.memberName ?? '참여자';
   const sentAtDate = new Date(dto.sentAt);
   return {
      id: dto.sendbirdMessageId,
      senderId: dto.senderId,
      senderName,
      content: dto.content ?? (dto.attachmentUrl ? '(첨부파일)' : ''),
      sentAt: isValid(sentAtDate) ? format(sentAtDate, 'HH:mm') : '',
      sentAtISO: dto.sentAt,
      isMine,
   };
}
