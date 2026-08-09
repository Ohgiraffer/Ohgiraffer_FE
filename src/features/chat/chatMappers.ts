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
      content: dto.content ?? '',
      attachmentUrl: dto.attachmentUrl,
      sentAt: isValid(sentAtDate) ? format(sentAtDate, 'HH:mm') : '',
      sentAtISO: dto.sentAt,
      isMine,
      // DTO엔 삭제 여부 필드가 없지만, 생성 시 content/attachmentUrl 중 하나는 항상 있어야 하므로
      // 둘 다 비어 있는 경우는 삭제된 메시지로만 나올 수 있다 - 다른 사용자가 지운 메시지도 이렇게 잡아낸다
      isDeleted: dto.content == null && dto.attachmentUrl == null,
   };
}

// 답장 인용 미리보기처럼 텍스트 한 줄만 보여줘야 하는 곳에서, 첨부파일만 있고 본문이 없는
// 메시지를 빈 문자열 대신 "(첨부파일)"로 표시하기 위한 헬퍼
export function getMessagePreviewText(message: Pick<ChatMessage, 'content' | 'attachmentUrl'>) {
   return message.content || (message.attachmentUrl ? '(첨부파일)' : '');
}

// 첨부파일 URL에서 파일명만 뽑아 보여주기 위한 헬퍼 - 말풍선 렌더링과 수정 시작 시
// 기존 첨부파일을 미리보기 배너에 표시하는 곳에서 공통으로 사용
export function getAttachmentFileName(url: string) {
   try {
      const path = new URL(url).pathname;
      return decodeURIComponent(path.slice(path.lastIndexOf('/') + 1));
   } catch {
      return '첨부파일';
   }
}
