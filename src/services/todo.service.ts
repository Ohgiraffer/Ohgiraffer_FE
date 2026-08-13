import { apiFetch } from '@/lib/http';

// SUBMISSION은 훈련생 role에만 내려옴(운영진에게는 오지 않음)
export type TodoSourceDomain = 'APPROVAL' | 'NOTICE' | 'CONSULTATION' | 'ATTENDANCE' | 'SUBMISSION';

export interface TodoItem {
   // 문서화된 값 외에 role별로 다른 도메인이 내려올 수 있어(훈련생/강사에서 확인됨) 문자열로 둔다.
   // 화면에서 매핑을 못 찾은 도메인은 기본값으로 처리한다
   sourceDomain: TodoSourceDomain | (string & {});
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
