export type EventType = '수업/발표' | '행사' | '개인';

export interface CalendarEvent {
   id: string;
   title: string;
   start: Date;
   end: Date;
   type: EventType;
   startTime?: string;
   endTime?: string;
   place?: string;
   // 종일 일정이면 시각 대신 "종일"로 표시
   allDay?: boolean;
   // 삭제 가능 여부(= 내가 등록했는지)
   editable?: boolean;
}

export const EVENT_TYPE_COLORS: Record<EventType, { dot: string; bg: string; text: string }> = {
   '수업/발표': { dot: '#2E4A3D', bg: '#E4EAE2', text: '#2E4A3D' },
   행사: { dot: '#6A2424', bg: '#F3E1E1', text: '#6A2424' },
   개인: { dot: '#E8B84B', bg: '#F6ECC9', text: '#7A5C12' },
};
