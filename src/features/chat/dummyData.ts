import type { ChatMessage, ChatUser, DirectChatRoom, GroupChatRoom } from './types';

// 하드코딩된 더미 데이터 — 추후 Sendbird 연동 시 교체 예정
export const CHAT_USERS: ChatUser[] = [
   { id: 'u1', name: '김훈련', role: '훈련생', email: 'example@test.com', isOnline: true },
   { id: 'u2', name: '이민지', role: '훈련생', email: 'example@test.com', isOnline: true },
   { id: 'u3', name: '박서준', role: '훈련생', email: 'example@test.com', isOnline: false },
   { id: 'u4', name: '최유나', role: '훈련생', email: 'example@test.com', isOnline: false },
   { id: 'u5', name: '정다현', role: '훈련생', email: 'example@test.com', isOnline: false },
   { id: 'u6', name: '박강사', role: '강사', email: 'example@test.com', isOnline: false },
   { id: 'u7', name: '이매니저', role: '매니저', email: 'example@test.com', isOnline: false },
];

const DIRECT_LAST_MESSAGES: Record<string, { lastMessage: string; lastMessageAt: string; unreadCount: number }> = {
   u1: { lastMessage: '과제 관련해서 질문 있습니다!', lastMessageAt: '11:02', unreadCount: 2 },
   u2: { lastMessage: '네 알겠습니다 :)', lastMessageAt: '어제', unreadCount: 0 },
   u6: { lastMessage: '알겠습니다. 발표 자료는 오전 중에 제출할게요!', lastMessageAt: '10:23', unreadCount: 0 },
};

export const DIRECT_ROOMS: DirectChatRoom[] = CHAT_USERS.map((user) => ({
   id: `direct-${user.id}`,
   type: 'direct',
   partner: user,
   ...DIRECT_LAST_MESSAGES[user.id],
}));

export const GROUP_ROOMS: GroupChatRoom[] = [
   {
      id: 'group-1',
      type: 'group',
      name: '2반 전체 채팅',
      memberCount: 24,
      lastMessage: '박강사: 오늘 오후 4시 발표 준비 잊지 마세요!',
      lastMessageAt: '10:23',
      unreadCount: 5,
   },
   {
      id: 'group-2',
      type: 'group',
      name: '팀 A — 프로젝트',
      memberCount: 4,
      lastMessage: '김철수: PR 리뷰 부탁드립니다',
      lastMessageAt: '09:41',
      unreadCount: 2,
   },
   {
      id: 'group-3',
      type: 'group',
      name: '팀 B — 알고리즘',
      memberCount: 3,
      lastMessage: '민지: 오늘 팀 회의 언제예요?',
      lastMessageAt: '어제',
      unreadCount: 1,
   },
];

export const DUMMY_MESSAGES: Record<string, ChatMessage[]> = {
   'direct-u6': [
      {
         id: 'm1',
         senderId: 'u6',
         senderName: '박강사',
         content: '안녕하세요! 오늘 오후 4시 팀 발표 준비 잘 되고 있나요?',
         sentAt: '10:20',
         isMine: false,
         isRead: true,
      },
      {
         id: 'm2',
         senderId: 'me',
         senderName: '나',
         content: '네, 슬라이드 거의 다 완성했습니다 :)',
         sentAt: '10:21',
         isMine: true,
         isRead: true,
      },
      {
         id: 'm3',
         senderId: 'u6',
         senderName: '박강사',
         content: '좋아요! 발표 시간은 팀당 15분이니 참고해주세요. 질의응답 5분 포함입니다.',
         sentAt: '10:22',
         isMine: false,
         isRead: true,
      },
      {
         id: 'm4',
         senderId: 'me',
         senderName: '나',
         content: '알겠습니다. 발표 자료는 오전 중에 제출할게요!',
         sentAt: '10:23',
         isMine: true,
         isRead: true,
      },
   ],
};
