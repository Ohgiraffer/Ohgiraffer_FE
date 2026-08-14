import { apiFetch } from '@/lib/http';

export interface TraineeConsultationHistoryEntry {
   consultationId: number;
   topic: string;
   scheduledAt: string; // yyyy-MM-ddTHH:mm:ss
   counselorName: string;
   // 현재 문서화된 값은 PENDING뿐이라 넓게 string으로 둔다 - 화면에서는 모르는 값이 와도
   // 원본 문자열을 그대로 보여주는 방식으로 방어한다
   status: string;
}

// 운영진용 - 훈련생 관리 상세 페이지의 상담 탭. 목록의 consultationId로 상세 조회/상담 내용
// 작성 API를 호출할 수 있다고 안내받았으나 그 API 자체는 아직 문서가 없어 목록 조회만 연동한다
export function getTraineeConsultationHistory(userId: number) {
   return apiFetch<TraineeConsultationHistoryEntry[]>(`/consultation/history/${userId}`);
}
