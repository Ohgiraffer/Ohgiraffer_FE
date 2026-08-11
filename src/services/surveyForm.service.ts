import { apiFetch, apiFetchBlob } from '@/lib/http';
import type {
   SurveyFormDetail,
   SurveyFormListItem,
   SurveyFormResponsesDetail,
   SurveyFormWriteRequest,
} from '@/features/submissions/types';

export function getSurveyForms() {
   return apiFetch<SurveyFormListItem[]>('/survey-forms');
}

export interface SurveyFormCreateRequest {
   title: string;
   dueAt: string;
}

export interface SurveyFormCreateResponse {
   surveyFormId: number;
   title: string;
   dueAt: string;
   status: string;
   googleFormId: string;
   editUrl: string;
   createdAt: string;
}

export function createSurveyForm(body: SurveyFormCreateRequest) {
   return apiFetch<SurveyFormCreateResponse>('/survey-forms', {
      method: 'POST',
      body: JSON.stringify(body),
   });
}

export interface SurveyFormUpdateResponse {
   surveyFormId: number;
   title: string;
   dueAt: string;
   status: string;
   editUrl: string;
   updatedAt: string;
}

export function updateSurveyForm(surveyFormId: number, body: SurveyFormWriteRequest) {
   return apiFetch<SurveyFormUpdateResponse>(`/survey-forms/${surveyFormId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
   });
}

export function deleteSurveyForm(surveyFormId: number) {
   // 204 No Content — apiFetch가 status 204를 undefined로 처리해줌
   return apiFetch<void>(`/survey-forms/${surveyFormId}`, {
      method: 'DELETE',
   });
}

export function getSurveyFormDetail(surveyFormId: number) {
   return apiFetch<SurveyFormDetail>(`/survey-forms/${surveyFormId}`);
}

export interface ValidateSheetLinkRequest {
   spreadsheetUrl: string;
   sheetName: string | null;
}

export interface ValidateSheetLinkResponse {
   surveyFormId: number;
   spreadsheetId: string;
   spreadsheetTitle: string;
   sheets: Array<{ sheetName: string; sheetGid: number }>;
   selectedSheetName: string | null;
   selectedSheetGid: number | null;
   columns: string[];
}

export function validateSurveySheetLink(surveyFormId: number, body: ValidateSheetLinkRequest) {
   return apiFetch<ValidateSheetLinkResponse>(
      `/survey-forms/${surveyFormId}/sheet-link/validate`,
      {
         method: 'POST',
         body: JSON.stringify(body),
      },
   );
}

export interface SaveSheetLinkRequest {
   spreadsheetUrl: string;
   sheetName: string;
}

export interface SaveSheetLinkResponse {
   surveyFormId: number;
   spreadsheetUrl: string;
   spreadsheetId: string;
   spreadsheetTitle: string;
   sheetName: string;
   sheetGid: number;
   connected: boolean;
   linkedAt: string;
}

export function saveSurveySheetLink(surveyFormId: number, body: SaveSheetLinkRequest) {
   return apiFetch<SaveSheetLinkResponse>(`/survey-forms/${surveyFormId}/sheet-link`, {
      method: 'PUT',
      body: JSON.stringify(body),
   });
}

// 응답 본문이 PDF 바이너리라 JSON 파싱하는 apiFetch로는 못 받는다
export function downloadSurveySummaryPdf(surveyFormId: number) {
   return apiFetchBlob(`/survey-forms/${surveyFormId}/summary`, { method: 'POST' });
}

export type SurveyResponseStatusFilter = 'ALL' | 'RESPONDED' | 'NOT_RESPONDED';

export interface GetSurveyResponsesParams {
   keyword?: string;
   responseStatus?: SurveyResponseStatusFilter;
   page?: number;
   size?: number;
}

export function getSurveyFormResponses(
   surveyFormId: number,
   params: GetSurveyResponsesParams = {},
) {
   const query = new URLSearchParams();
   if (params.keyword) query.set('keyword', params.keyword);
   if (params.responseStatus) query.set('responseStatus', params.responseStatus);
   query.set('page', String(params.page ?? 0));
   query.set('size', String(params.size ?? 20));

   return apiFetch<SurveyFormResponsesDetail>(
      `/survey-forms/${surveyFormId}/responses?${query.toString()}`,
   );
}
