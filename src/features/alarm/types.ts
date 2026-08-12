export type NotificationItem = {
   id: number;
   title: string;
   description: string;
   // 상대 시간 표시용 문자열 ("10분 전" 등)
   timestamp: string;
   isRead: boolean;
   // 클릭 시 이동할 관련 페이지 - relatedEntityType/Id로부터 계산됨(mapNotification.ts)
   link?: string;
   // 채팅 관련 알림(CHAT_MENTION 등)은 이동할 페이지가 없어 채팅 패널을 대신 연다
   opensChatPanel?: boolean;
};
