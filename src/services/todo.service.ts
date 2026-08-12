import { apiFetch } from '@/lib/http';

export type TodoSourceDomain = 'APPROVAL' | 'NOTICE' | 'CONSULTATION' | 'ATTENDANCE';

export interface TodoItem {
   sourceDomain: TodoSourceDomain;
   // 화면에 표시할 라벨 - role별로 문구가 달라질 수 있어 서버 값을 그대로 쓴다
   type: string;
   count: number;
   // 가장 가까운 마감/예정 시각. count가 0이면 null
   nearestDueTime: string | null;
}

// 대시보드 "할일 관리" 카드 전용 - STUDENT/INSTRUCTOR/MANAGER 모두 이 API 하나를 쓰고,
// 항목 구성은 role에 따라 서버가 알아서 다르게 내려준다
export function getTodoSummary() {
   return apiFetch<TodoItem[]>('/todo');
}
