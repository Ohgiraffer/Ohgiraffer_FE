import type { AiSyncSummaryItem, SyncHistoryEntry } from './types';

// 백엔드 동기화/이력 API 연동 전까지 화면 확인용으로 쓰는 더미 데이터
export const MOCK_SYNC_SUMMARY: AiSyncSummaryItem[] = [
   {
      traineeId: 'trainee-1',
      traineeName: '김철수',
      scoreChange: 8,
      comment: '알고리즘 문제 풀이 방식이 눈에 띄게 개선되었습니다.',
      needsCheckNote: '3주차 과제 제출 누락 여부 재확인 필요',
   },
   {
      traineeId: 'trainee-2',
      traineeName: '이영희',
      scoreChange: -5,
      comment: '발표 내용은 풍부하나 시간 초과로 감점이 반영되었습니다.',
      needsCheckNote: null,
   },
   {
      traineeId: 'trainee-3',
      traineeName: '박민준',
      scoreChange: 3,
      comment: '코드 리뷰 참여도가 향상되었습니다.',
      needsCheckNote: null,
   },
   {
      traineeId: 'trainee-4',
      traineeName: '최지은',
      scoreChange: null,
      comment: '팀 협업 기여도가 높으나 점수 컬럼 값이 비어 있습니다.',
      needsCheckNote: '점수 입력 여부 확인 필요',
   },
];

export const MOCK_SYNC_HISTORY: SyncHistoryEntry[] = [
   {
      id: 'sync-1',
      syncedAt: '2025-07-30T14:22:00',
      executedByName: '이매니저',
      changeCount: 4,
      summary: MOCK_SYNC_SUMMARY,
   },
   {
      id: 'sync-2',
      syncedAt: '2025-07-15T10:05:00',
      executedByName: '이매니저',
      changeCount: 2,
      summary: MOCK_SYNC_SUMMARY.slice(0, 2),
   },
   {
      id: 'sync-3',
      syncedAt: '2025-06-30T09:00:00',
      executedByName: '이매니저',
      changeCount: 1,
      summary: MOCK_SYNC_SUMMARY.slice(0, 1),
   },
];
