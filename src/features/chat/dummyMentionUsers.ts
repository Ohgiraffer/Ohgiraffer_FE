import type { ChatMentionUser } from './types';

// TODO: 채팅방 멤버를 이름과 함께 조회하는 API가 아직 없어 하드코딩 — API가 생기면 교체 예정.
// (실제 전송 시에는 이 목록의 id가 실제 사용자 id와 매칭되지 않아 mentionedUserIds는 항상 빈 배열로 보낸다)
export const DUMMY_MENTION_USERS: ChatMentionUser[] = [
   { id: 1001, name: '김훈련', roleLabel: '훈련생 · 2반' },
   { id: 1002, name: '이민지', roleLabel: '훈련생 · 2반' },
   { id: 1003, name: '박서준', roleLabel: '훈련생 · 2반' },
   { id: 1004, name: '최유나', roleLabel: '훈련생 · 1반' },
   { id: 1005, name: '정다현', roleLabel: '훈련생 · 1반' },
   { id: 1006, name: '박강사', roleLabel: '강사' },
];
