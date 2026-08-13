export type TargetScope = 'INDIVIDUAL' | 'TEAM';
export type LatePolicy = 'BLOCK' | 'ALLOW';
export type SubmissionItemType = 'FILE' | 'LINK';

// GET /submission-boxes 목록 행 하나. submittedCount/targetCount는 운영진 응답에만,
// submitted/submissionId는 훈련생 응답에만 채워진다
export interface SubmissionBoxListItem {
   submissionBoxId: number;
   projectName: string;
   targetScope: TargetScope;
   startAt: string;
   dueAt: string;
   latePolicy: LatePolicy;
   itemCount: number;
   status: string;
   acceptingSubmissions: boolean;
   lateSubmission: boolean;
   submittedCount?: number;
   targetCount?: number;
   submitted?: boolean;
   submissionId?: number | null;
}

// 제출함 생성/수정 요청·응답에서 쓰는 제출 항목
export interface SubmissionBoxItemSpec {
   // 기존 항목은 실제 ID, 새로 추가한 항목은 null
   submissionBoxItemId: number | null;
   itemName: string;
   itemType: SubmissionItemType;
   allowedFileTypes: string | null;
   required: boolean;
}

// POST/PATCH /submission-boxes 요청 본문
export interface SubmissionBoxWriteRequest {
   projectName: string;
   targetScope: TargetScope;
   startAt: string;
   dueAt: string;
   latePolicy: LatePolicy;
   items: SubmissionBoxItemSpec[];
}

export interface SubmissionItemValue {
   submissionItemValueId: number;
   submissionBoxItemId: number;
   itemType: SubmissionItemType;
   originalFileName: string | null;
   contentType: string | null;
   fileSize: number | null;
   externalUrl: string | null;
}

// GET /submission-boxes/{id}/submissions 의 submissions[] 항목 (팀 또는 개인 1건)
export interface SubmissionEntry {
   targetId: number;
   targetName: string;
   // 개인 제출자의 이메일. 팀 제출이면 null
   targetEmail: string | null;
   submissionId: number | null;
   submitted: boolean;
   mine: boolean;
   late: boolean;
   submittedAt: string | null;
   canSubmit: boolean;
   canEdit: boolean;
   values: SubmissionItemValue[];
}

// GET /submission-boxes/{id}/submissions 응답 전체 (운영진 제출 현황 상세)
export interface SubmissionBoxSubmissionsDetail {
   submissionBoxId: number;
   projectName: string;
   targetScope: TargetScope;
   startAt: string;
   dueAt: string;
   latePolicy: LatePolicy;
   submittedCount: number;
   targetCount: number;
   items: (SubmissionBoxItemSpec & { sortOrder: number })[];
   page: number;
   size: number;
   filteredCount: number;
   totalPages: number;
   submissions: SubmissionEntry[];
}

// GET /submission-boxes/{id} 훈련생 응답 (제출함 상세 + 본인/팀 제출 가능 여부)
export interface SubmissionBoxDetailForStudent {
   submissionBoxId: number;
   projectName: string;
   targetScope: TargetScope;
   startAt: string;
   dueAt: string;
   latePolicy: LatePolicy;
   createdBy: number;
   status: string;
   acceptingSubmissions: boolean;
   lateSubmission: boolean;
   submittedCount: number;
   targetCount: number | null;
   mySubmissionId: number | null;
   canSubmit: boolean;
   canEdit: boolean;
   items: (SubmissionBoxItemSpec & { sortOrder: number })[];
   submissions: SubmissionEntry[];
}

export type SurveyFormStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';

// GET /survey-forms 목록 행 하나 (운영진 기준. responded/responseUrl은 훈련생 응답에만 채워짐)
export interface SurveyFormListItem {
   surveyFormId: number;
   title: string;
   dueAt: string;
   status: SurveyFormStatus;
   respondedCount: number;
   targetCount: number;
   responded: boolean | null;
   responseUrl: string | null;
   createdAt: string;
}

export interface SurveyFormSheetLink {
   connected: boolean;
   spreadsheetUrl: string;
   spreadsheetId: string;
   spreadsheetTitle: string;
   sheetGid: number;
   sheetName: string;
   linkedAt: string;
}

// GET /survey-forms/{id}. googleFormId/editUrl/createdBy/updatedAt/sheetLink는 운영진 응답에만,
// responseUrl은 훈련생 응답에만 채워진다. sheetLink는 연결 전이면 응답에서 생략됨
export interface SurveyFormDetail {
   surveyFormId: number;
   title: string;
   dueAt: string;
   status: SurveyFormStatus;
   googleFormId?: string;
   editUrl?: string;
   createdBy?: number;
   createdAt?: string;
   updatedAt?: string;
   sheetLink?: SurveyFormSheetLink;
   responseUrl?: string;
}

export interface SurveyFormWriteRequest {
   title: string;
   dueAt: string;
   status: SurveyFormStatus;
}

export interface SurveyFormResponseStudent {
   userId: number;
   name: string;
   email: string;
   responded: boolean;
   submittedAt: string | null;
}

// GET /survey-forms/{id}/responses
export interface SurveyFormResponsesDetail {
   surveyFormId: number;
   title: string;
   surveyStatus: SurveyFormStatus;
   dueAt: string;
   respondedCount: number;
   targetCount: number;
   page: number;
   size: number;
   filteredCount: number;
   totalPages: number;
   students: SurveyFormResponseStudent[];
}
