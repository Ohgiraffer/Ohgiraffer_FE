import { apiFetch } from '@/lib/http';

export interface AiSummary {
   summaryText: string;
   generatedAt: string;
}

// 캐시를 무시하고 강제로 새 요약을 생성한다 - 현재는 "캐시된 요약만 조회"하는 별도 API가 없어서
// 위젯을 처음 열 때와 재생성 버튼을 눌렀을 때 모두 이 엔드포인트를 그대로 사용한다
export function refreshAiSummary() {
   return apiFetch<AiSummary>('/ai-assistant/summary/refresh', {
      method: 'POST',
   });
}
