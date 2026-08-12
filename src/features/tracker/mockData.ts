// 결재/팀/상담/제출 탭은 대응하는 API가 아직 없어 디자인 확인용 목데이터를 그대로 쓴다.
// 출결(현황·달력·통계) 관련 데이터는 전부 실제 API(attendance.service.ts)로 대체됨
import type { TraineeStaticDetail } from './types';

export const MOCK_TRAINEE_STATIC_DETAILS: Record<number, TraineeStaticDetail> = {
   1: {
      approvals: [
         { requestedAt: '2026-07-10', type: '휴가 결재', period: '2026-07-15 ~ 2026-07-15(1일)', approvedAt: '2026-07-11' },
         { requestedAt: '2026-06-20', type: '병결 신청', period: '2026-06-21 ~ 2026-06-21(1일)', approvedAt: '2026-06-20' },
      ],
      teams: [
         { teamName: '팀 A', activePeriod: '2025-05-01 ~ 2025-05-30' },
         { teamName: '팀 D', activePeriod: '2025-03-01 ~ 2025-04-30' },
      ],
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
      submissions: [
         { boxName: '팀 최종 발표자료', status: '제출완료', submittedAt: '07/30 14:32' },
         { boxName: '팀 최종 발표자료', status: '제출완료', submittedAt: '07/30 14:33' },
         { boxName: '팀 중간 발표자료', status: '미제출', submittedAt: null },
         { boxName: '중간 개인 프로젝트', status: '제출완료', submittedAt: '06/28 11:05' },
      ],
   },
};

const EMPTY_STATIC_DETAIL: TraineeStaticDetail = {
   approvals: [],
   teams: [],
   consultations: [],
   submissions: [],
};

// MOCK_TRAINEE_STATIC_DETAILS에 없는 훈련생(김철수 외)은 빈 목록으로 보여준다
export function getTraineeStaticDetail(traineeId: number): TraineeStaticDetail {
   return MOCK_TRAINEE_STATIC_DETAILS[traineeId] ?? EMPTY_STATIC_DETAIL;
}
