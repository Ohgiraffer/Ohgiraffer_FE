import { apiFetch } from '@/lib/http';

export type CalendarEventApiType =
   | 'CLASS'
   | 'PRESENTATION'
   | 'ASSIGNMENT'
   | 'EVENT'
   | 'PERSONAL'
   | 'HOLIDAY';

export interface CalendarEventApiItem {
   calendarEventId: number;
   title: string;
   eventType: CalendarEventApiType;
   // KST, 타임존 표기 없는 ISO 문자열
   startTime: string;
   endTime: string;
   allDay: boolean;
   location: string | null;
   // 내가 등록했는지 = 삭제 가능 여부
   editable: boolean;
}

// month는 1~12 (Date.getMonth()는 0부터라 +1 필요). 조회 월에 걸치는 일정은 시작월이
// 달라도 함께 내려온다
export function getCalendarEvents(year: number, month: number) {
   return apiFetch<CalendarEventApiItem[]>(`/calendar-events?year=${year}&month=${month}`);
}
