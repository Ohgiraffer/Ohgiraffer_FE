import { endOfDay, startOfDay } from 'date-fns';
import type { CalendarEventApiItem } from '@/services/calendarEvent.service';
import type { CalendarEvent, EventType } from './types';

// HOLIDAY는 일정 칩이 아니라 날짜를 빨간색으로 표시하는 용도라 매핑 대상에서 뺀다(mapCalendarEvent가 null 반환)
const EVENT_TYPE_MAP: Partial<Record<CalendarEventApiItem['eventType'], EventType>> = {
   CLASS: '수업/발표',
   PRESENTATION: '수업/발표',
   ASSIGNMENT: '수업/발표',
   EVENT: '행사',
   PERSONAL: '개인',
};

function toHHmm(isoTime: string) {
   return isoTime.slice(11, 16);
}

export function mapCalendarEvent(item: CalendarEventApiItem): CalendarEvent | null {
   const type = EVENT_TYPE_MAP[item.eventType];
   if (!type) return null;
   return {
      id: String(item.calendarEventId),
      title: item.title,
      start: new Date(item.startTime),
      end: new Date(item.endTime),
      type,
      startTime: item.allDay ? undefined : toHHmm(item.startTime),
      endTime: item.allDay ? undefined : toHHmm(item.endTime),
      place: item.location ?? undefined,
      allDay: item.allDay,
      editable: item.editable,
   };
}

// 시작일만 비교하면 이전 달에 시작해 이 날짜까지 걸쳐 있는 일정이 빠지므로, 시작~종료 구간이
// 이 날짜와 겹치는지로 판정한다(서버가 월간 조회에서 쓰는 규칙과 동일)
export function isEventInDay(start: Date, end: Date, day: Date) {
   return start <= endOfDay(day) && end >= startOfDay(day);
}
