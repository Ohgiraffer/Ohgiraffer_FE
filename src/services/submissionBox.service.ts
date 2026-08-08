import { apiFetch, apiFetchBlob } from '@/lib/http';
import type {
   SubmissionBoxDetailForStudent,
   SubmissionBoxListItem,
   SubmissionBoxSubmissionsDetail,
   SubmissionBoxWriteRequest,
   SubmissionItemValue,
} from '@/features/submissions/types';

export function getSubmissionBoxes() {
   return apiFetch<SubmissionBoxListItem[]>('/submission-boxes');
}

// GET /submission-boxes/{id} — 훈련생 전용 상세(본인/팀 제출 가능 여부 + 전체 제출 현황 포함)
export function getSubmissionBoxDetailForStudent(submissionBoxId: number) {
   return apiFetch<SubmissionBoxDetailForStudent>(`/submission-boxes/${submissionBoxId}`);
}

export interface SubmissionBoxCreateResponse {
   submissionBoxId: number;
   projectName: string;
   targetScope: string;
   startAt: string;
   dueAt: string;
   latePolicy: string;
   itemCount: number;
}

export function createSubmissionBox(body: SubmissionBoxWriteRequest) {
   return apiFetch<SubmissionBoxCreateResponse>('/submission-boxes', {
      method: 'POST',
      body: JSON.stringify(body),
   });
}

export function updateSubmissionBox(submissionBoxId: number, body: SubmissionBoxWriteRequest) {
   return apiFetch<unknown>(`/submission-boxes/${submissionBoxId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
   });
}

export function deleteSubmissionBox(submissionBoxId: number) {
   // 204 No Content — apiFetch가 status 204를 undefined로 처리해줌
   return apiFetch<void>(`/submission-boxes/${submissionBoxId}`, {
      method: 'DELETE',
   });
}

export type SubmissionStatusFilter = 'ALL' | 'SUBMITTED' | 'NOT_SUBMITTED';

export interface GetSubmissionsParams {
   keyword?: string;
   status?: SubmissionStatusFilter;
   page?: number;
   size?: number;
}

export function getSubmissionBoxSubmissions(
   submissionBoxId: number,
   params: GetSubmissionsParams = {},
) {
   const query = new URLSearchParams();
   if (params.keyword) query.set('keyword', params.keyword);
   if (params.status) query.set('status', params.status);
   query.set('page', String(params.page ?? 0));
   query.set('size', String(params.size ?? 20));

   return apiFetch<SubmissionBoxSubmissionsDetail>(
      `/submission-boxes/${submissionBoxId}/submissions?${query.toString()}`,
   );
}

export interface SubmissionItemPreview {
   submissionItemValueId: number;
   originalFileName: string;
   contentType: string;
   fileSize: number;
   previewUrl: string;
}

export function getSubmissionItemPreview(submissionItemValueId: number) {
   return apiFetch<SubmissionItemPreview>(
      `/submissions/items/${submissionItemValueId}/preview`,
   );
}

// 302 redirect로 내려오는 바이너리라 apiFetch(JSON 파싱)로는 못 받는다
export function downloadSubmissionItem(submissionItemValueId: number) {
   return apiFetchBlob(`/submissions/items/${submissionItemValueId}/download`);
}

export interface SubmitItemInput {
   submissionBoxItemId: number;
   fileIndex: number | null;
   externalUrl: string | null;
}

export interface SubmissionWriteResponse {
   submissionId: number;
   submissionBoxId: number;
   ownerUserId: number | null;
   teamId: number | null;
   submittedBy: number;
   submittedAt: string;
   late: boolean;
}

export interface SubmissionUpdateResponse extends SubmissionWriteResponse {
   items: SubmissionItemValue[];
}

// request part는 JSON 문자열이 아니라 application/json Blob으로 담아야 하고, Content-Type을
// 수동으로 지정하면 안 된다(브라우저가 multipart boundary를 자동으로 붙여야 함) - apiFetch가
// body가 FormData면 Content-Type을 안 붙이므로 그대로 넘긴다
function buildSubmissionFormData(request: unknown, files: File[]) {
   const formData = new FormData();
   formData.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));
   files.forEach((file) => formData.append('files', file));
   return formData;
}

export function submitMyBox(submissionBoxId: number, items: SubmitItemInput[], files: File[]) {
   return apiFetch<SubmissionWriteResponse>('/submissions', {
      method: 'POST',
      body: buildSubmissionFormData({ submissionBoxId, items }, files),
   });
}

export function updateMySubmission(
   submissionId: number,
   items: SubmitItemInput[],
   files: File[],
) {
   return apiFetch<SubmissionUpdateResponse>(`/submissions/${submissionId}`, {
      method: 'PATCH',
      body: buildSubmissionFormData({ items }, files),
   });
}
