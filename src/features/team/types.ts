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
