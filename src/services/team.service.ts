import { apiFetch } from '@/lib/http';
import type {
   Team,
   TeamHistoryResult,
   TeamMember,
   TeamWriteRequest,
   UnassignedStudent,
} from '@/features/team/types';

export function getTeams() {
   return apiFetch<{ teams: Team[] }>('/teams').then((res) => res.teams);
}

export function getUnassignedStudents() {
   return apiFetch<{ students: UnassignedStudent[] }>('/teams/unassigned-students').then(
      (res) => res.students,
   );
}

export function createTeam(body: TeamWriteRequest) {
   return apiFetch<Team>('/teams', {
      method: 'POST',
      body: JSON.stringify(body),
   });
}

export function updateTeam(teamId: number, body: TeamWriteRequest) {
   return apiFetch<Team>(`/teams/${teamId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
   });
}

export function assignTeamMember(teamId: number, userId: number) {
   return apiFetch<TeamMember>(`/teams/${teamId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
   });
}

export function moveTeamMember(teamId: number, memberId: number, targetTeamId: number) {
   return apiFetch<TeamMember>(`/teams/${teamId}/members/${memberId}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ targetTeamId }),
   });
}

export function removeTeamMember(teamId: number, memberId: number) {
   return apiFetch<void>(`/teams/${teamId}/members/${memberId}`, {
      method: 'DELETE',
   });
}

export function getTeamHistories(startDate: string, endDate: string) {
   return apiFetch<TeamHistoryResult>(
      `/teams/histories?startDate=${startDate}&endDate=${endDate}`,
   );
}
