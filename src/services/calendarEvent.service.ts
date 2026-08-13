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

export interface CreateCalendarEventPayload {
   title: string;
   // 운영진(강사·매니저)만 필수 - CLASS/PRESENTATION/ASSIGNMENT/EVENT 중 하나. 훈련생은
   // 생략하면 서버가 PERSONAL로 등록한다
   eventType?: CalendarEventApiType;
   startDate: string; // yyyy-MM-dd
   startTime?: string; // HH:mm, 생략하면 종일 취급
   endDate: string;
   endTime?: string;
   location?: string;
   // 현재 서버에서 실제로 동작하지 않음(문서 명시) - 그래도 계약대로 보내둔다
   notifyTrainees?: boolean;
}

export interface CreateCalendarEventResponse {
   calendarEventId: number;
   title: string;
   eventType: CalendarEventApiType;
   startTime: string;
   endTime: string;
   allDay: boolean;
   location: string | null;
}

export function createCalendarEvent(payload: CreateCalendarEventPayload) {
   return apiFetch<CreateCalendarEventResponse>('/calendar-events', {
      method: 'POST',
      body: JSON.stringify(payload),
   });
}

// 여러 건을 지울 때는 이 API를 건마다 호출한다 - 한 건이 실패해도 나머지는 지워지므로
// 호출부에서 Promise.allSettled로 건별 성공/실패를 구분해야 한다
export function deleteCalendarEvent(calendarEventId: number) {
   return apiFetch<void>(`/calendar-events/${calendarEventId}`, {
      method: 'DELETE',
   });
}
