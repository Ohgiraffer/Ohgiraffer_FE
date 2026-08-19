import { serverApiFetch } from '@/lib/auth/serverPrefetch';
import type { Counselor, StaffConsultationSummary } from '@/services/counseling.service';

// counseling.service.ts의 getCounselors()/getUpcomingConsultations()/getConsultationHistory()와
// 동일한 엔드포인트. 두 역할 다 기본 탭(운영진: 상담 이력 조회, 훈련생: 상담 신청)이 첫 화면에
// 필요로 하는 것만 프리페치한다 - 상담 가능일/시간처럼 사용자가 날짜를 골라야 알 수 있는
// 데이터는 서버가 미리 알 수 없어서 대상이 아니다

export interface ServerStaffCounselingData {
   initialCounselors: Counselor[];
   initialUpcoming: StaffConsultationSummary[];
   initialHistory: StaffConsultationSummary[];
}

export async function getServerStaffCounselingData(
   accessToken: string,
): Promise<ServerStaffCounselingData> {
   const [initialCounselors, initialUpcoming, initialHistory] = await Promise.all([
      serverApiFetch<Counselor[]>('/consultation/counselors', accessToken),
      serverApiFetch<StaffConsultationSummary[]>('/consultation/upcoming', accessToken),
      serverApiFetch<StaffConsultationSummary[]>('/consultation/history', accessToken),
   ]);
   return { initialCounselors, initialUpcoming, initialHistory };
}

export interface ServerStudentCounselingData {
   initialCounselors: Counselor[];
}

export async function getServerStudentCounselingData(
   accessToken: string,
): Promise<ServerStudentCounselingData> {
   const initialCounselors = await serverApiFetch<Counselor[]>('/consultation/counselors', accessToken);
   return { initialCounselors };
}
