import { differenceInCalendarDays, format, isValid } from 'date-fns';

// 서버가 내려주는 LocalDateTime 문자열(예: '2026-08-20T23:59:00')을 화면 표시용으로 변환
export function formatDateTime(iso: string | null | undefined) {
   if (!iso) return '—';
   const date = new Date(iso);
   return isValid(date) ? format(date, 'yyyy-MM-dd HH:mm') : '—';
}

// DatePicker(yyyy-MM-dd)용 - ISO 문자열에서 날짜 부분만 추출
export function toDateInputValue(iso: string | null | undefined) {
   if (!iso) return '';
   return iso.slice(0, 10);
}

// 마감일까지 남은/지난 일수를 D-3, D-day, D+11 형식으로 표시
export function formatDday(dueAt: string | null | undefined) {
   if (!dueAt) return '';
   const date = new Date(dueAt);
   if (!isValid(date)) return '';
   const days = differenceInCalendarDays(date, new Date());
   if (days === 0) return 'D-day';
   return days > 0 ? `D-${days}` : `D+${Math.abs(days)}`;
}
