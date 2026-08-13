import type { NoticeEventType } from '@/services/notice.service';

export type NoticeVisibility = 'public' | 'private';

export const NOTICE_EVENT_TYPE_OPTIONS: Array<{ value: NoticeEventType; label: string }> = [
   { value: 'CLASS', label: '수업/발표' },
   { value: 'EVENT', label: '행사' },
];
