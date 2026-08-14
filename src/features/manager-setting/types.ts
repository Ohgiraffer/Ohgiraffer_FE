import type { BootcampOrgInfo, BootcampPeriod } from '@/features/bootcamp-settings/types';

export type ManagerSettingTab = 'org' | 'users' | 'history';

export type AttendanceUnitPeriod = BootcampPeriod;

export type OrgSettingsData = BootcampOrgInfo & {
   attendanceUnitPeriods: AttendanceUnitPeriod[];
};

export type UserRole = '훈련생' | '강사' | '매니저';

export type ManagerSettingUser = {
   id: string;
   name: string;
   email: string;
   role: UserRole;
   team: string | null;
   status: '활성' | '수료' | '삭제됨';
};

export type ChangeHistoryEntry = {
   changedByName: string;
   changedAt: string;
   changedField: string;
   oldValue: string;
   newValue: string;
};

// "사용자 등록" 모달의 "직접 입력" 탭
export type UserDraftRow = {
   id: string;
   name: string;
   email: string;
   phone: string;
   role: UserRole;
};
