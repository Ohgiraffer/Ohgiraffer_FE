export type EventType = '수업/발표' | '행사' | '개인';
export type UserRole = '매니저' | '훈련생';

export interface CalendarEvent {
   id: string;
   title: string;
   start: Date;
   end: Date;
   type: EventType;
   registrant: string;
   startTime?: string;
   endTime?: string;
   place?: string;
}

export const EVENT_TYPE_COLORS: Record<EventType, { dot: string; bg: string; text: string }> = {
   '수업/발표': { dot: '#2E4A3D', bg: '#E4EAE2', text: '#2E4A3D' },
   행사: { dot: '#6A2424', bg: '#F3E1E1', text: '#6A2424' },
   개인: { dot: '#E8B84B', bg: '#F6ECC9', text: '#7A5C12' },
};

// 로그인 기능이 붙기 전까지 쓰는 더미 현재 사용자 — 역할에 따라 등록 모달 구성이 달라진다
export const CURRENT_USER: { name: string; role: UserRole } = {
   name: '이매니저',
   role: '매니저',
};
