// 팀원 드래그 데이터 전용 MIME 타입 - 'text/plain'을 쓰면 외부에서 드래그된 텍스트나 빈 값도
// Number()가 0으로 변환해 통과시켜버리므로 전용 타입으로 구분해 걸러낸다
export const TEAM_MEMBER_DRAG_TYPE = 'application/x-campflow-team-member';

export interface TeamMember {
   teamMemberId: number;
   userId: number;
   userName: string;
   email: string;
   joinedAt: string;
}

export interface Team {
   teamId: number;
   name: string;
   startDate: string | null;
   endDate: string | null;
   dissolved: boolean;
   memberCount: number;
   members: TeamMember[];
}

export interface UnassignedStudent {
   userId: number;
   name: string;
   email: string;
}

export interface TeamWriteRequest {
   name: string;
   startDate: string;
   endDate: string;
}
