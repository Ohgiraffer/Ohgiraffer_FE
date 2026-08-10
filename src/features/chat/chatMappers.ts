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
      // 백엔드가 삭제된 메시지도 목록에 그대로 포함시키되 content를 자체 삭제 표시 문구로
      // 대체해서 내려준다(스펙 확인됨) - null이 되는 게 아니라서 별도 isDeleted 추론은 하지 않고
      // 그 문구를 그대로 보여준다. 이번 세션에서 내가 직접 삭제한 메시지만 아래 delete 핸들러들이
      // 로컬에서 isDeleted를 true로 세팅해 즉시 스타일을 바꿔준다
      content: dto.content ?? '',
      attachmentUrl: dto.attachmentUrl,
      sentAt: isValid(sentAtDate) ? format(sentAtDate, 'HH:mm') : '',
      sentAtISO: dto.sentAt,
      isMine,
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
