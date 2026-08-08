import { apiFetch } from '@/lib/http';
import type { UserRole } from '@/services/auth.service';
import { getMyUserId } from '@/lib/auth/current-user';

// ============================================================
// ▼▼▼ TEMP MOCK — 디자인 작업용 임시 목데이터. 요청 시 이 블록과
// 아래 각 함수의 "TEMP MOCK" 표시가 붙은 분기를 전부 지우면 원상복구된다. ▼▼▼
// ============================================================
const MOCK_CHAT = true;

const MOCK_CHANNELS: ChatChannel[] = [
   {
      channelId: 'mock-dm-1',
      name: '김아름',
      channelType: 'DM',
      lastMessageContent: '네 알겠습니다!',
      lastMessageSentAt: '2026-08-07T09:00:00Z',
      unreadCount: 2,
   },
   {
      channelId: 'mock-dm-2',
      name: '유수정',
      channelType: 'DM',
      lastMessageContent: '오늘 회의 몇 시죠?',
      lastMessageSentAt: '2026-08-06T17:30:00Z',
      unreadCount: 0,
   },
   {
      channelId: 'mock-group-1',
      name: '매니저 방',
      channelType: 'GROUP',
      lastMessageContent: '자료 공유드립니다',
      lastMessageSentAt: '2026-08-07T08:00:00Z',
      unreadCount: 5,
   },
];

const MOCK_USERS: ChatUserSearchResult[] = [
   { userId: 2, name: '김아름', profileUrl: null, isOnline: true, role: 'MANAGER' },
   { userId: 3, name: '유수정', profileUrl: null, isOnline: false, role: 'MANAGER' },
   { userId: 4, name: '이정기', profileUrl: null, isOnline: true, role: 'INSTRUCTOR' },
   { userId: 5, name: '최자경', profileUrl: null, isOnline: false, role: 'STUDENT' },
];

const MOCK_MEMBERS: ChatChannelMember[] = [
   { userId: 1, memberName: '고은해', joinedAt: '2026-08-01T00:00:00Z', isRead: true },
   { userId: 2, memberName: '김아름', joinedAt: '2026-08-01T00:00:00Z', isRead: true },
   { userId: 3, memberName: '유수정', joinedAt: '2026-08-01T00:00:00Z', isRead: true },
   { userId: 4, memberName: '이정기', joinedAt: '2026-08-01T00:00:00Z', isRead: false },
   { userId: 5, memberName: '최자경', joinedAt: '2026-08-01T00:00:00Z', isRead: true },
];

const MOCK_MESSAGES: ChatMessageDto[] = [
   {
      sendbirdMessageId: 'mock-m1',
      channelId: 'mock-group-1',
      senderId: 3,
      content: '안녕하세요~ 오늘 회의 자료 준비됐나요?',
      attachmentUrl: null,
      messageType: 'MESG',
      sentAt: '2026-08-07T07:55:00Z',
   },
   {
      sendbirdMessageId: 'mock-m2',
      channelId: 'mock-group-1',
      senderId: 2,
      content: '자료 공유드립니다',
      attachmentUrl: null,
      messageType: 'MESG',
      sentAt: '2026-08-07T08:00:00Z',
   },
   {
      sendbirdMessageId: 'mock-m3',
      channelId: 'mock-group-1',
      senderId: 1,
      content: '확인했습니다, 감사해요!',
      attachmentUrl: null,
      messageType: 'MESG',
      sentAt: '2026-08-07T08:02:00Z',
   },
];

let mockMessageSeq = MOCK_MESSAGES.length;
// createReply의 TEMP MOCK 응답을 루트 메시지 id별로 쌓아, getMessageReplies TEMP MOCK이 그대로 돌려준다
const mockRepliesByRoot: Record<string, ChatMessageDto[]> = {};

function mockChannelDetail(channelId: string): ChatChannelDetail {
   const channel = MOCK_CHANNELS.find((c) => c.channelId === channelId);
   return {
      channelId,
      name: channel?.name ?? '목데이터 채팅방',
      channelType: channel?.channelType ?? 'GROUP',
      members: MOCK_MEMBERS,
      readCount: MOCK_MEMBERS.length,
      readUserIds: MOCK_MEMBERS.map((m) => m.userId),
   };
}
// ============================================================
// ▲▲▲ TEMP MOCK 끝 ▲▲▲
// ============================================================

export interface ChatChannel {
   channelId: string;
   name: string;
   channelType: 'DM' | 'GROUP';
   lastMessageContent: string | null;
   lastMessageSentAt: string | null;
   unreadCount: number;
}

export function getChannels(type?: 'dm' | 'group') {
   if (MOCK_CHAT) {
      // TEMP MOCK
      const filtered = type
         ? MOCK_CHANNELS.filter((c) => c.channelType === type.toUpperCase())
         : MOCK_CHANNELS;
      return Promise.resolve(filtered);
   }
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
   if (MOCK_CHAT) {
      // TEMP MOCK
      return Promise.resolve(
         MOCK_USERS.filter((u) => u.name?.toLowerCase().includes(search.toLowerCase())),
      );
   }
   return apiFetch<ChatUserSearchResult[]>(`/chat/users?search=${encodeURIComponent(search)}`);
}

export interface ChatUserStatus {
   userId: number;
   isOnline: boolean;
   lastSeenAt: string;
}

export function getUserStatus(userId: number) {
   if (MOCK_CHAT) {
      // TEMP MOCK
      const user = MOCK_USERS.find((u) => u.userId === userId);
      return Promise.resolve<ChatUserStatus>({
         userId,
         isOnline: user?.isOnline ?? false,
         lastSeenAt: '2026-08-07T08:00:00Z',
      });
   }
   return apiFetch<ChatUserStatus>(`/chat/users/${userId}/status`);
}

export interface CreateChannelResponse {
   channelId: string;
   name: string;
}

export function createChannel(userIds: number[], name?: string) {
   if (MOCK_CHAT) {
      // TEMP MOCK
      return Promise.resolve<CreateChannelResponse>({
         channelId: 'mock-new-channel',
         name: name ?? '새 목데이터 채팅방',
      });
   }
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
   if (MOCK_CHAT) {
      // TEMP MOCK
      return Promise.resolve(mockChannelDetail(channelId));
   }
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
   if (MOCK_CHAT) {
      // TEMP MOCK
      mockMessageSeq += 1;
      return Promise.resolve<ChatMessageDto>({
         sendbirdMessageId: `mock-m${mockMessageSeq}`,
         channelId,
         senderId: getMyUserId() ?? 1,
         content: payload.content ?? null,
         attachmentUrl: payload.attachmentUrl ?? null,
         messageType: payload.attachmentUrl ? 'FILE' : 'MESG',
         sentAt: '2026-08-07T09:30:00Z',
      });
   }
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
   if (MOCK_CHAT) return Promise.resolve(); // TEMP MOCK
   return apiFetch<void>(`/chat/messages/${encodeURIComponent(messageId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
   });
}

// 스펙 문서에 삭제 요청 형식이 따로 없어 REST 관례대로 DELETE + 바디 없음으로 구현했다.
// 실제 백엔드 동작이 다르면(예: 바디에 channelId 필요) 이 함수만 조정하면 된다.
export function deleteMessage(messageId: string) {
   if (MOCK_CHAT) return Promise.resolve(); // TEMP MOCK
   return apiFetch<void>(`/chat/messages/${encodeURIComponent(messageId)}`, {
      method: 'DELETE',
   });
}

export function uploadChatAttachment(channelId: string, file: File) {
   if (MOCK_CHAT) return Promise.resolve({ url: URL.createObjectURL(file) }); // TEMP MOCK
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
   if (MOCK_CHAT) {
      // TEMP MOCK
      const keyword = params.keyword?.toLowerCase() ?? '';
      const content = keyword
         ? MOCK_MESSAGES.filter((m) => m.content?.toLowerCase().includes(keyword))
         : MOCK_MESSAGES;
      return Promise.resolve<ChatMessagePage>({
         content,
         totalElements: content.length,
         totalPages: 1,
      });
   }
   const query = new URLSearchParams();
   Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') query.set(key, String(value));
   });
   return apiFetch<ChatMessagePage>(`/chat/search?${query.toString()}`);
}

// 스펙 문서의 응답 예시가 채널 상세 조회(getChannelDetail)와 동일하게 적혀있어 복붙 오류로 보인다.
// 실제 메시지 이력이라면 검색 API와 같은 페이지 형태일 것으로 가정해 구현했다.
export function getChannelMessages(channelId: string, page = 0, size = 20) {
   if (MOCK_CHAT) {
      // TEMP MOCK
      return Promise.resolve<ChatMessagePage>({
         content: MOCK_MESSAGES,
         totalElements: MOCK_MESSAGES.length,
         totalPages: 1,
      });
   }
   return apiFetch<ChatMessagePage>(
      `/chat/channels/${encodeURIComponent(channelId)}/messages?page=${page}&size=${size}`,
   );
}

export function getMessageReplies(messageId: string) {
   if (MOCK_CHAT) return Promise.resolve<ChatMessageDto[]>(mockRepliesByRoot[messageId] ?? []); // TEMP MOCK
   return apiFetch<ChatMessageDto[]>(`/chat/messages/${encodeURIComponent(messageId)}/replies`);
}

export interface CreateReplyPayload {
   channelId: string;
   content?: string | null;
   attachmentUrl?: string | null;
}

export function createReply(messageId: string, payload: CreateReplyPayload) {
   if (MOCK_CHAT) {
      // TEMP MOCK
      mockMessageSeq += 1;
      const dto: ChatMessageDto = {
         sendbirdMessageId: `mock-m${mockMessageSeq}`,
         channelId: payload.channelId,
         senderId: getMyUserId() ?? 1,
         content: payload.content ?? null,
         attachmentUrl: payload.attachmentUrl ?? null,
         messageType: payload.attachmentUrl ? 'FILE' : 'MESG',
         sentAt: '2026-08-07T09:35:00Z',
      };
      mockRepliesByRoot[messageId] = [...(mockRepliesByRoot[messageId] ?? []), dto];
      return Promise.resolve(dto);
   }
   return apiFetch<ChatMessageDto>(`/chat/messages/${encodeURIComponent(messageId)}/replies`, {
      method: 'POST',
      body: JSON.stringify(payload),
   });
}
