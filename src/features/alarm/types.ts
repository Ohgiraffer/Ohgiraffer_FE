export type NotificationItem = {
   id: string;
   title: string;
   description: string;
   // 상대 시간 표시용 문자열 ("10분 전" 등) - 실제로는 백엔드에서 내려줄 예정
   timestamp: string;
   isRead: boolean;
   // 클릭 시 이동할 관련 페이지 - 해당 페이지에 들렀다 오면 읽음 처리됨(백엔드 처리 예정, 지금은 클릭 즉시 mock으로 처리)
   link?: string;
};
