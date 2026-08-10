import { apiFetch } from '@/lib/http';
import type { UserRole } from '@/services/auth.service';

export interface ChatChannel {
   channelId: string;
   name: string;
   channelType: 'DM' | 'GROUP';
   lastMessageContent: string | null;
   lastMessageSentAt: string | null;
   unreadCount: number;
}

export function getChannels(type?: 'dm' | 'group') {
   return apiFetch<ChatChannel[]>(`/chat/channels${type ? `?type=${type}` : ''}`);
}

export interface ChatUserSearchResult {
   userId: number;
   // 실제 데이터에 이름이 비어있는 사용자가 있어(백엔드 확인됨) null도 허용한다
   name: string | null;
   profileUrl: string | null;
   isOnline: boolean;
   role: UserRole;
}

export function searchChatUsers(search: string) {
   return apiFetch<ChatUserSearchResult[]>(`/chat/users?search=${encodeURIComponent(search)}`);
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
   joinedAt: string;
   isRead: boolean;
}

export interface ChatChannelDetail {
   channelId: string;
   name: string;
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

// 스펙 문서의 응답 예시가 채널 상세 조회(getChannelDetail)와 동일하게 적혀있어 복붙 오류로 보인다.
// 실제 메시지 이력이라면 검색 API와 같은 페이지 형태일 것으로 가정해 구현했다.
export function getChannelMessages(channelId: string, page = 0, size = 20) {
   return apiFetch<ChatMessagePage>(
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

export interface UnreadCountResponse {
   totalUnreadCount: number;
}

export function getUnreadCount() {
   return apiFetch<UnreadCountResponse>('/chat/unread-count');
}
