import type { NoticeEventType } from '@/services/notice.service';

export type NoticeVisibility = 'public' | 'private';

// AI 일정 추출 모달의 "유형" 셀렉트에 쓰는 라벨 - PERSONAL/HOLIDAY는 이 흐름으로 등록할 수 없어서
// (등록 시 400/INVALID_INPUT_VALUE) 애초에 선택지에 넣지 않는다
export const NOTICE_EVENT_TYPE_OPTIONS: Array<{ value: NoticeEventType; label: string }> = [
   { value: 'CLASS', label: '수업' },
   { value: 'PRESENTATION', label: '발표' },
   { value: 'ASSIGNMENT', label: '과제 제출' },
   { value: 'EVENT', label: '행사' },
];
