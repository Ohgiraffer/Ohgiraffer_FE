import { apiFetch } from '@/lib/http';

export type SubmissionHistorySourceType = 'SUBMISSION_BOX' | 'SURVEY_FORM';

export type SubmissionHistoryTargetScope = 'INDIVIDUAL' | 'TEAM' | null;

export type SubmissionHistoryStatus = 'SUBMITTED' | 'NOT_SUBMITTED' | 'RESPONDED' | 'NOT_RESPONDED';

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
   return apiFetch<StudentSubmissionHistoryResponse>(`/students/${studentId}/submission-history`);
}
