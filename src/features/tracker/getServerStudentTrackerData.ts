import { serverApiFetch } from '@/lib/auth/serverPrefetch';
import type { AttendanceSummaryResponse, LeaveSickCountResponse } from '@/services/attendance.service';

export interface ServerStudentTrackerData {
   initialSummary: AttendanceSummaryResponse;
   initialLeaveSick: LeaveSickCountResponse;
}

// useAttendanceOverview.ts의 getMyAttendanceSummary()/getMyLeaveSickCount()와 동일한 엔드포인트.
// 월간 달력(getMyAttendanceMonthly)은 "이번 달"이 서버·클라이언트 타임존에 따라 자정 근처에서
// 어긋날 수 있어 프리페치하지 않는다 - 그 부분은 그대로 클라이언트에서 자기 로컬 날짜 기준으로 조회
export async function getServerStudentTrackerData(
   accessToken: string,
): Promise<ServerStudentTrackerData> {
   const [initialSummary, initialLeaveSick] = await Promise.all([
      serverApiFetch<AttendanceSummaryResponse>('/attendance/summary', accessToken),
      serverApiFetch<LeaveSickCountResponse>('/attendance/leave-sick/count', accessToken),
   ]);
   return { initialSummary, initialLeaveSick };
}
