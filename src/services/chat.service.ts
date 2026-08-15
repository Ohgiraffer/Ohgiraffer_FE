import { apiFetch } from '@/lib/http';
import type { UserRole } from '@/services/auth.service';

export interface ChatChannel {
   channelId: string;
   name: string;
   channelType: 'DM' | 'GROUP';
   lastMessageContent: string | null;
   lastMessageSentAt: string | null;
   unreadCount: number;
   // DM만 값이 있고 GROUP은 null (온라인 여부도 마찬가지)
   profileImageUrl: string | null;
   isOnline: boolean | null;
}

export interface GetChannelsParams {
   type?: 'dm' | 'group';
   search?: string;
}

export function getChannels(params?: GetChannelsParams) {
   const query = new URLSearchParams();
   if (params?.type) query.set('type', params.type);
   if (params?.search) query.set('search', params.search);
   const qs = query.toString();
   return apiFetch<ChatChannel[]>(`/chat/channels${qs ? `?${qs}` : ''}`);
}

export interface ChatUserStatus {
   userId: number;
   isOnline: boolean;
   lastSeenAt: string;
}

export function getUserStatus(userId: number) {
   return apiFetch<ChatUserStatus>(`/chat/users/${userId}/status`);
}

export interface CreateChannelResponse {
   channelId: string;
   name: string;
}

export function createChannel(userIds: number[], name?: string) {
   return apiFetch<CreateChannelResponse>('/chat/channels', {
      method: 'POST',
      body: JSON.stringify({ userIds, name }),
   });
}

export interface ChatChannelMember {
   userId: number;
   memberName: string;
   email: string;
   role: UserRole;
   profileImageUrl: string | null;
   joinedAt: string;
   isRead: boolean;
}

export interface ChatChannelDetail {
   channelId: string;
   // DM 채널은 실제 응답에서 null로 옴 - 표시용 이름은 멤버 목록에서 상대방을 찾아 계산해야 함
   name: string | null;
   channelType: 'DM' | 'GROUP';
   members: ChatChannelMember[];
   readCount: number;
   readUserIds: number[];
}

export function getChannelDetail(channelId: string) {
   return apiFetch<ChatChannelDetail>(`/chat/channels/${encodeURIComponent(channelId)}`);
}

export interface ChatMessageDto {
   sendbirdMessageId: string;
   channelId: string;
   senderId: number;
   content: string | null;
   attachmentUrl: string | null;
   messageType: 'MESG' | 'FILE' | null;
   sentAt: string;
   // 아직 이 메시지를 읽지 않은 참여자 수 - 스펙 문서 기준 필드, 재배포 전 응답에는 없을 수 있어
   // 사용하는 쪽(mapMessageDto)에서 기본값 처리한다
   unreadCount: number;
}

export interface SendMessagePayload {
   content?: string | null;
   attachmentUrl?: string | null;
   mentionedUserIds?: number[];
}

export function sendMessage(channelId: string, payload: SendMessagePayload) {
   return apiFetch<ChatMessageDto>(`/chat/channels/${encodeURIComponent(channelId)}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload),
   });
}

export interface EditMessagePayload {
   channelId: string;
   content?: string | null;
   attachmentUrl?: string | null;
}

export function editMessage(messageId: string, payload: EditMessagePayload) {
   return apiFetch<void>(`/chat/messages/${encodeURIComponent(messageId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
   });
}

export function deleteMessage(messageId: string, channelId: string) {
   return apiFetch<void>(
      `/chat/messages/${encodeURIComponent(messageId)}?channelId=${encodeURIComponent(channelId)}`,
      { method: 'DELETE' },
   );
}

export function uploadChatAttachment(channelId: string, file: File) {
   const formData = new FormData();
   formData.append('file', file);
   return apiFetch<{ url: string }>(`/chat/channels/${encodeURIComponent(channelId)}/attachments`, {
      method: 'POST',
      body: formData,
   });
}

export interface ChatMessagePage {
   content: ChatMessageDto[];
   totalElements: number;
   totalPages: number;
   // 마지막 페이지인지 - 검색/채널 이력 전체 페이지를 순회해 끝까지 불러올 때 종료 조건으로 쓴다
   last: boolean;
}

export interface ChatSearchParams {
   channelId?: string;
   senderId?: number;
   keyword?: string;
   startDate?: string;
   endDate?: string;
   page?: number;
   size?: number;
}

export function searchMessages(params: ChatSearchParams) {
   const query = new URLSearchParams();
   Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') query.set(key, String(value));
   });
   return apiFetch<ChatMessagePage>(`/chat/search?${query.toString()}`);
}

// 검색 API(searchMessages)와 달리 Page로 감싸지 않고 배열을 그대로 내려준다(실 응답 확인됨).
// 응답에 총 개수/마지막 페이지 여부가 없어, 호출 쪽에서 반환된 길이가 요청한 size보다
// 작으면 마지막 페이지로 간주하는 방식으로 페이지네이션 종료를 판단해야 한다
export function getChannelMessages(channelId: string, page = 0, size = 20) {
   return apiFetch<ChatMessageDto[]>(
      `/chat/channels/${encodeURIComponent(channelId)}/messages?page=${page}&size=${size}`,
   );
}

export function getMessageReplies(messageId: string) {
   return apiFetch<ChatMessageDto[]>(`/chat/messages/${encodeURIComponent(messageId)}/replies`);
}

export interface CreateReplyPayload {
   channelId: string;
   content?: string | null;
   attachmentUrl?: string | null;
}

export function createReply(messageId: string, payload: CreateReplyPayload) {
   return apiFetch<ChatMessageDto>(`/chat/messages/${encodeURIComponent(messageId)}/replies`, {
      method: 'POST',
      body: JSON.stringify(payload),
   });
}

export interface MessageReplyCountResponse {
   messageId: string;
   replyCount: number;
}

// 스펙 문서의 요청 예시는 경로가 /chat/messages/{messageId}이지만, 세 가지 에러 응답의
// path가 전부 /chat/messages/{messageId}/reply-count로 일관되게 적혀있어 후자를 실제 경로로 판단했다.
// messageId는 항상 원본(루트) 메시지 기준이어야 한다 - 답글 자체의 id로 조회하면 스펙상 0이 나온다
export function getMessageReplyCount(messageId: string) {
   return apiFetch<MessageReplyCountResponse>(
      `/chat/messages/${encodeURIComponent(messageId)}/reply-count`,
   );
}

export interface UnreadCountResponse {
   totalUnreadCount: number;
}

export function getUnreadCount() {
   return apiFetch<UnreadCountResponse>('/chat/unread-count');
}

export interface ChatbotChannelResponse {
   channelUrl: string;
}

// 사용자-챗봇 간 1:1 채널 - 백엔드가 미리 만들어둔 sendbird 채널 URL을 그대로 내려준다.
// 이 값은 그대로 ChatChannel.channelId로 써서 기존 채널 열기(handleSelectRoom) 흐름을 그대로 탄다
export function getChatbotChannel() {
   return apiFetch<ChatbotChannelResponse>('/chat/channel');
}

export interface SendbirdSessionTokenResponse {
   sendbirdUserId: string;
   sessionToken: string;
   appId: string;
   expiresAt: string | null;
}

// 채팅 진입 시 1회 호출 - 신규/기존 유저 분기는 백엔드가 처리하고, 프론트는 결과로 받은
// sendbirdUserId + sessionToken을 그대로 SendbirdChat.connect()에 넘기기만 하면 된다
export function getSendbirdSessionToken() {
   return apiFetch<SendbirdSessionTokenResponse>('/chat/sendbird/session-token', {
      method: 'POST',
   });
}
