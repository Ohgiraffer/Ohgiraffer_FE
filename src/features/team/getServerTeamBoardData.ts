import { serverApiFetch } from '@/lib/auth/serverPrefetch';
import type { Team, TeamPeriod, UnassignedStudent } from './types';

export interface ServerTeamBoardData {
   initialPeriods: TeamPeriod[];
   initialActivePeriodId: number | null;
   initialTeams: Team[];
   initialUnassigned: UnassignedStudent[];
}

// team.service.ts의 getTeamPeriods/getTeams/getUnassignedStudents와 동일한 엔드포인트·응답
// 언래핑·정렬 로직을 서버에서 그대로 반복한다(로직이 두 곳에서 어긋나면 클라이언트가 나중에
// 다시 불러왔을 때 기간 정렬 등이 달라 보일 수 있음). ManagerTeamBoard와 같은 "마지막 항목 =
// 최신 기간" 규칙으로 activePeriodId를 정한다
export async function getServerTeamBoardData(accessToken: string): Promise<ServerTeamBoardData> {
   const { periods } = await serverApiFetch<{ periods: TeamPeriod[] }>(
      '/teams/periods',
      accessToken,
   );
   const initialPeriods = [...periods].sort((a, b) => a.startDate.localeCompare(b.startDate));

   if (initialPeriods.length === 0) {
      return { initialPeriods, initialActivePeriodId: null, initialTeams: [], initialUnassigned: [] };
   }

   const initialActivePeriodId = initialPeriods[initialPeriods.length - 1].teamPeriodId;
   const [{ teams }, { students }] = await Promise.all([
      serverApiFetch<{ teams: Team[] }>(`/teams?periodId=${initialActivePeriodId}`, accessToken),
      serverApiFetch<{ students: UnassignedStudent[] }>(
         `/teams/unassigned-students?periodId=${initialActivePeriodId}`,
         accessToken,
      ),
   ]);

   return { initialPeriods, initialActivePeriodId, initialTeams: teams, initialUnassigned: students };
}
