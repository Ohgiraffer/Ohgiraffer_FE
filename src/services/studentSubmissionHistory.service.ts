import { apiFetch } from '@/lib/http';

export type SubmissionHistorySourceType = 'SUBMISSION_BOX' | 'SURVEY_FORM';

export type SubmissionHistoryTargetScope = 'INDIVIDUAL' | 'TEAM' | null;

export type SubmissionHistoryStatus =
   | 'SUBMITTED'
   | 'NOT_SUBMITTED'
   | 'RESPONDED'
   | 'NOT_RESPONDED'
   // 설문 응답 여부를 Google Forms API로 확인하다가 실패한 경우(호출 한도 초과 등) - 제출/응답
   // 자체의 실패가 아니라 확인 절차의 실패라 다른 상태와 구분해 별도 라벨을 붙인다
   | 'RESPONSE_CHECK_FAILED';

export interface SubmissionHistoryItem {
   sourceType: SubmissionHistorySourceType;
   targetId: number;
   title: string;
   // 설문 항목은 항상 null
   targetScope: SubmissionHistoryTargetScope;
   status: SubmissionHistoryStatus;
   completed: boolean;
   completedAt: string | null;
   dueAt: string;
   // 설문은 항상 false
   late: boolean;
}

export interface StudentSubmissionHistoryResponse {
   studentId: number;
   studentName: string;
   email: string;
   totalCount: number;
   completedCount: number;
   // 마감일 내림차순으로 이미 정렬되어 내려옴
   items: SubmissionHistoryItem[];
}

// 운영진용 - 훈련생 관리 상세 페이지의 제출 탭. 제출함 제출 여부 + 설문 응답 여부를 통합 조회한다
export function getStudentSubmissionHistory(studentId: number) {
   return apiFetch<StudentSubmissionHistoryResponse>(`/submissions/students/${studentId}/history`);
}
