import { apiFetch } from '@/lib/http';
import type { ConsultationStatus } from '@/services/counseling.service';

export interface TraineeConsultationHistoryEntry {
   consultationId: number;
   topic: string;
   scheduledAt: string; // yyyy-MM-ddTHH:mm:ss
   counselorName: string;
   status: ConsultationStatus;
}

// 운영진용 - 훈련생 관리 상세 페이지의 상담 탭. 목록의 consultationId로 상세 조회/상담 내용
// 작성 API를 호출할 수 있다고 안내받았으나 그 API 자체는 아직 문서가 없어 목록 조회만 연동한다
export function getTraineeConsultationHistory(userId: number) {
   return apiFetch<TraineeConsultationHistoryEntry[]>(`/consultation/history/${userId}`);
}
