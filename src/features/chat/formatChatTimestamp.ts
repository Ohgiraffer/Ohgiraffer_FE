import { format, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';

// 채팅방 목록의 최근 메시지 시각
// 오늘이면 시:분만, 아니면 날짜(yy-MM-dd)만 표시
export function formatChatTimestamp(iso: string) {
   const date = new Date(iso);
   return isToday(date) ? format(date, 'HH:mm') : format(date, 'yy-MM-dd');
}

// 대화 중 날짜가 바뀌는 지점에 보여줄 구분선 라벨
export function formatChatDateDivider(iso: string) {
   return format(new Date(iso), 'yyyy년 M월 d일 EEEE', { locale: ko });
}
