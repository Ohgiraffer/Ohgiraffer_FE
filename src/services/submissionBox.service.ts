import { apiFetch } from '@/lib/http';
import type {
   SubmissionBoxDetailForStudent,
   SubmissionBoxListItem,
   SubmissionBoxSubmissionsDetail,
   SubmissionBoxWriteRequest,
   SubmissionItemType,
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

export interface SubmissionDownloadResponse {
   submissionItemValueId: number;
   originalFileName: string;
   contentType: string;
   fileSize: number;
   // 임시 presigned URL - 저장하거나 재사용하지 않고 매번 새로 요청해서 받은 값만 바로 써야 한다
   downloadUrl: string;
}

// 더 이상 302로 S3에 리다이렉트하지 않고, 실제 다운로드에 쓸 presigned URL을 JSON으로 내려준다
export function downloadSubmissionItem(submissionItemValueId: number) {
   return apiFetch<SubmissionDownloadResponse>(
      `/submissions/items/${submissionItemValueId}/download`,
   );
}

export interface SubmitItemInput {
   submissionBoxItemId: number;
   itemType: SubmissionItemType;
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
   // 수정 스펙은 items에 itemType을 보내면 안 된다(이미 정해진 항목이라 불필요) - 호출부는
   // 생성과 같은 SubmitItemInput(itemType 포함)을 그대로 넘기고, 여기서 요청 직전에 벗겨낸다
   const updateItems = items.map(({ submissionBoxItemId, fileIndex, externalUrl }) => ({
      submissionBoxItemId,
      fileIndex,
      externalUrl,
   }));
   return apiFetch<SubmissionUpdateResponse>(`/submissions/${submissionId}`, {
      method: 'PATCH',
      body: buildSubmissionFormData({ items: updateItems }, files),
   });
}
