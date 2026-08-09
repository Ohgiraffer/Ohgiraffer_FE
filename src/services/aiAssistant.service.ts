import { apiFetch } from '@/lib/http';

export interface AiSummary {
   summaryText: string;
   generatedAt: string;
}

// 캐시가 있으면 그대로 재사용하고, 없을 때만 새로 생성한다 - 위젯을 열 때 이 엔드포인트를 쓴다
export function getAiSummary() {
   return apiFetch<AiSummary>('/ai-assistant/summary');
}

// 캐시를 무시하고 강제로 새 요약을 생성한다 - "재생성" 버튼에서만 사용한다
export function refreshAiSummary() {
   return apiFetch<AiSummary>('/ai-assistant/summary/refresh', {
      method: 'POST',
   });
}
