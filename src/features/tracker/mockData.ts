// 상담 탭은 대응하는 API가 아직 없어 디자인 확인용 목데이터를 그대로 쓴다.
// 출결/결재/팀/제출 탭은 전부 실제 API(attendance.service.ts, approval.service.ts,
// team.service.ts, studentSubmissionHistory.service.ts)로 대체됨
import type { TraineeStaticDetail } from './types';

export const MOCK_TRAINEE_STATIC_DETAILS: Record<number, TraineeStaticDetail> = {
   1: {
      consultations: [
         {
            consultedAt: '2025.07.20 14:00',
            counselorName: '박강사',
            title: '프로젝트 방향 피드백 — 범위 축소 및 MVP 완성 목표 설정',
            status: '완료',
         },
         {
            consultedAt: '2025.06.15 10:00',
            counselorName: '이매니저',
            title: '출결 주의 단계 안내 및 개선 계획 수립',
            status: '완료',
         },
      ],
   },
};

const EMPTY_STATIC_DETAIL: TraineeStaticDetail = {
   consultations: [],
};

// MOCK_TRAINEE_STATIC_DETAILS에 없는 훈련생(김철수 외)은 빈 목록으로 보여준다
export function getTraineeStaticDetail(traineeId: number): TraineeStaticDetail {
   return MOCK_TRAINEE_STATIC_DETAILS[traineeId] ?? EMPTY_STATIC_DETAIL;
}
