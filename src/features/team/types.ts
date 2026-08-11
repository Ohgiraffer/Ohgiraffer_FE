// 팀원 드래그 데이터 전용 MIME 타입 - 'text/plain'을 쓰면 외부에서 드래그된 텍스트나 빈 값도
// Number()가 0으로 변환해 통과시켜버리므로 전용 타입으로 구분해 걸러낸다
export const TEAM_MEMBER_DRAG_TYPE = 'application/x-campflow-team-member';

export interface TeamPeriod {
   teamPeriodId: number;
   startDate: string;
   endDate: string;
}

export interface TeamMember {
   teamMemberId: number;
   userId: number;
   // 스펙상 STRING(필수)이지만 실제 응답에 이름이 null인 사용자가 확인됨 - 화면에서 방어 처리 필요
   userName: string | null;
   // 훈련생 요청 시 null로 내려옴
   email: string | null;
   profileImgUrl: string | null;
   joinedAt: string;
}

export interface Team {
   teamId: number;
   name: string;
   // 팀 편성 기간에서 그대로 물려받는 값이라 항상 존재함
   startDate: string;
   endDate: string;
   memberCount: number;
   sendbirdChannelUrl: string | null;
   notionPageId: string | null;
   members: TeamMember[];
}

export interface UnassignedStudent {
   userId: number;
   // TeamMember.userName과 동일한 이유로 null 가능
   name: string | null;
   email: string;
   profileImgUrl: string | null;
}

// 보드 화면에서 실제 팀과 아직 저장 안 한 새 팀을 같은 모양으로 다루기 위한 얇은 타입.
// teamId >= 0이면 실제(서버에 존재하는) 팀, teamId < 0이면 이번 세션에서 추가했지만
// 아직 저장 버튼을 안 눌러 서버엔 없는 임시 팀(클라이언트 전용 id)
export interface DraftTeam {
   teamId: number;
   name: string;
   startDate: string;
   endDate: string;
}

export interface TeamConfigurationTeamInput {
   // 기존 팀이면 실제 teamId, 새로 추가한 팀이면 null
   teamId: number | null;
   name: string;
   memberUserIds: number[];
}

export interface TeamConfigurationRequest {
   teamPeriodId: number;
   teams: TeamConfigurationTeamInput[];
   deletedTeamIds?: number[];
   unassignedUserIds?: number[];
   // true면 저장 완료 후 팀별 Sendbird 채팅방을 생성/멤버 동기화한다(트랜잭션 커밋 후 별도 후처리)
   createChatChannel?: boolean;
   // true면 저장 완료 후 팀별 Notion 페이지를 생성/수정한다(트랜잭션 커밋 후 별도 후처리)
   createNotionPage?: boolean;
}

export interface TeamHistorySnapshotMember {
   userId: number;
   // TeamMember.userName과 동일한 이유로 null 가능
   userName: string | null;
   profileImgUrl: string | null;
}

export interface TeamHistorySnapshotTeam {
   teamId: number;
   teamName: string;
   memberCount: number;
   members: TeamHistorySnapshotMember[];
}

export interface TeamChangeHistoryEntry {
   userId: number;
   userName: string;
   profileImgUrl: string | null;
   // 미배정이면 null
   fromTeamId: number | null;
   fromTeamName: string;
   toTeamId: number | null;
   toTeamName: string;
   changedAt: string;
}

export interface TeamHistoryResult {
   snapshotDate: string;
   teams: TeamHistorySnapshotTeam[];
   histories: TeamChangeHistoryEntry[];
}

export interface TeamWorkspace {
   teamId: number;
   teamName: string;
   // 아직 Notion 페이지가 생성되지 않았으면 null
   notionPageId: string | null;
}
