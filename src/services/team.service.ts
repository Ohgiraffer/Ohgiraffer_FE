import { apiFetch } from '@/lib/http';
import type {
   Team,
   TeamConfigurationRequest,
   TeamHistoryResult,
   TeamPeriod,
   TeamWorkspace,
   UnassignedStudent,
} from '@/features/team/types';

export function getTeamPeriods() {
   return apiFetch<{ periods: TeamPeriod[] }>('/teams/periods').then((res) => res.periods);
}

export function createTeamPeriod(body: { startDate: string; endDate: string }) {
   return apiFetch<TeamPeriod>('/teams/periods', {
      method: 'POST',
      body: JSON.stringify(body),
   });
}

export function updateTeamPeriod(
   periodId: number,
   body: { startDate: string; endDate: string },
) {
   return apiFetch<TeamPeriod>(`/teams/periods/${periodId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
   });
}

// 활성 팀원이 없는 기간만 삭제 가능 - 204 No Content
export function deleteTeamPeriod(periodId: number) {
   return apiFetch<void>(`/teams/periods/${periodId}`, {
      method: 'DELETE',
   });
}

export function getTeams(periodId: number) {
   return apiFetch<{ teams: Team[] }>(`/teams?periodId=${periodId}`).then((res) => res.teams);
}

export function getUnassignedStudents() {
   return apiFetch<{ students: UnassignedStudent[] }>('/teams/unassigned-students').then(
      (res) => res.students,
   );
}

// 팀 추가/이름 변경/팀원 배정·이동·제외를 화면에서 초안으로만 들고 있다가, 저장 버튼을
// 누른 시점의 최종 상태를 이 API 한 번으로 반영한다(개별 팀/팀원 API는 더 이상 없음).
// 204(본문 없음)로 응답할 수도 있어 apiFetch가 undefined를 돌려줄 수 있다 - 호출부에서
// 반환값을 안 쓰고 성공 여부만 보므로 그대로 넘긴다(.teams로 단정해서 읽으면 204일 때 TypeError)
export function updateTeamConfiguration(body: TeamConfigurationRequest) {
   return apiFetch<{ teams: Team[] } | undefined>('/teams/configuration', {
      method: 'PATCH',
      body: JSON.stringify(body),
   });
}

export function getTeamHistories(periodId: number, startDate: string, endDate: string) {
   return apiFetch<TeamHistoryResult>(
      `/teams/histories?periodId=${periodId}&startDate=${startDate}&endDate=${endDate}`,
   );
}

export function getTeamWorkspace(teamId: number) {
   return apiFetch<TeamWorkspace>(`/teams/${teamId}/workspace`);
}
