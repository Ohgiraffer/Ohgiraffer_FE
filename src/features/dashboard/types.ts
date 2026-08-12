export type EventType = '수업/발표' | '행사' | '개인';
export type UserRole = '매니저' | '훈련생';

export interface CalendarEvent {
   id: string;
   title: string;
   start: Date;
   end: Date;
   type: EventType;
   // 서버에서 받아온 일정은 등록자명을 내려주지 않음(editable로만 소유 여부 판단) - 이번 세션에
   // 로컬로 새로 등록한 일정에만 채워짐
   registrant?: string;
   startTime?: string;
   endTime?: string;
   place?: string;
   // 종일 일정이면 시각 대신 "종일"로 표시
   allDay?: boolean;
   // 삭제 가능 여부(= 내가 등록했는지). 서버 데이터는 API 값을 그대로, 로컬 생성 일정은 항상 true
   editable?: boolean;
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
