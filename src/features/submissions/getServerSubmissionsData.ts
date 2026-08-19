import { serverApiFetch } from '@/lib/auth/serverPrefetch';
import type { SubmissionBoxListItem, SurveyFormListItem } from './types';

export interface ServerSubmissionsData {
   initialBoxes: SubmissionBoxListItem[];
   initialForms: SurveyFormListItem[];
}

// submissionBox.service.ts/surveyForm.service.ts의 getSubmissionBoxes()/getSurveyForms()와
// 동일한 엔드포인트. 매니저 화면은 탭(제출함/설문)이 URL 쿼리로도 바뀔 수 있어 둘 다 프리페치한다
export async function getServerSubmissionsData(accessToken: string): Promise<ServerSubmissionsData> {
   const [initialBoxes, initialForms] = await Promise.all([
      serverApiFetch<SubmissionBoxListItem[]>('/submission-boxes', accessToken),
      serverApiFetch<SurveyFormListItem[]>('/survey-forms', accessToken),
   ]);
   return { initialBoxes, initialForms };
}
