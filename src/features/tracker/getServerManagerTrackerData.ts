import { serverApiFetch } from '@/lib/auth/serverPrefetch';
import type { UserListItem } from '@/services/user.service';
import type { BootcampSettingsResponse } from '@/services/bootcampSettings.service';
import type {
   AttendanceDashboardSummary,
   AttendanceListItem,
   PresentAbsentCountPoint,
} from '@/services/attendance.service';

export interface ServerManagerTrackerData {
   initialUsers: UserListItem[];
   initialBootcampSettings: BootcampSettingsResponse;
   initialStats: AttendanceDashboardSummary;
   initialAttendanceList: AttendanceListItem[];
   initialTrend: PresentAbsentCountPoint[];
}

// useManagerTrackerData.ts가 client-side에서 부르는 5개 zero-param 조회와 동일한 엔드포인트.
// 추이 그래프는 periodId 없이(=오늘이 속한 단위기간) 부르는 기본값만 프리페치한다 - 사용자가
// 단위기간 셀렉트를 바꾸면 그건 기존처럼 클라이언트가 그 시점에 다시 불러온다
export async function getServerManagerTrackerData(
   accessToken: string,
): Promise<ServerManagerTrackerData> {
   const [initialUsers, initialBootcampSettings, initialStats, initialAttendanceList, initialTrend] =
      await Promise.all([
         serverApiFetch<UserListItem[]>('/user/list', accessToken),
         serverApiFetch<BootcampSettingsResponse>('/bootcamp/settings', accessToken),
         serverApiFetch<AttendanceDashboardSummary>('/attendance/dashboard-summary', accessToken),
         serverApiFetch<AttendanceListItem[]>('/attendance/list', accessToken),
         serverApiFetch<PresentAbsentCountPoint[]>('/attendance/present-absent/count', accessToken),
      ]);
   return { initialUsers, initialBootcampSettings, initialStats, initialAttendanceList, initialTrend };
}
