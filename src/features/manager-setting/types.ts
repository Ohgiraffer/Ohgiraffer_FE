export type ManagerSettingTab = 'org' | 'users' | 'history';

export type AttendanceUnitPeriod = {
   id: string;
   startDate: string;
   endDate: string;
};

export type WarningCriteria = {
   cautionRate: string;
   warningRate: string;
   expulsionRiskRate: string;
};

export type OrgSettingsData = {
   orgName: string;
   courseName: string;
   startDate: string;
   endDate: string;
   attendanceUnitPeriods: AttendanceUnitPeriod[];
   warningCriteria: WarningCriteria;
};

export type UserRole = '훈련생' | '강사' | '매니저';

export type ManagerSettingUser = {
   id: string;
   name: string;
   email: string;
   role: UserRole;
   team: string | null;
   status: '활성' | '삭제됨';
};

export type ChangeHistoryEntry = {
   id: string;
   changedBy: string;
   changedAt: string;
   itemLabel: string;
   category: string;
   beforeValue: string;
   afterValue: string;
   isFlagged: boolean;
};

// "사용자 등록" 모달의 "직접 입력" 탭에서 한 행(row)의 입력값
export type UserDraftRow = {
   id: string;
   name: string;
   email: string;
   phone: string;
   role: UserRole;
};
