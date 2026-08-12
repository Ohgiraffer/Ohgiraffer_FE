import type { BootcampOrgInfo, BootcampPeriod } from '@/features/bootcamp-settings/types';

export type ManagerSettingTab = 'org' | 'users' | 'history';

export type AttendanceUnitPeriod = BootcampPeriod;

// 경고·제적 기준은 /bootcamp/settings API 범위에 없어(온보딩에서만 다루는 값) 여기서는 제외
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
   // 백엔드 UserStatus(ACTIVE/COMPLETED/WITHDRAWN/EXPELLED)를 화면 라벨로 매핑한 값 -
   // 자퇴/제적은 둘 다 "삭제됨"으로 묶어서 보여준다
   status: '활성' | '수료' | '삭제됨';
};

// /bootcamp/settings/logs 응답 그대로 - 백엔드에 카테고리·강조표시 구분이 없어 그 항목들은 화면에서도 뺐다
export type ChangeHistoryEntry = {
   changedByName: string;
   changedAt: string;
   changedField: string;
   oldValue: string;
   newValue: string;
};

// "사용자 등록" 모달의 "직접 입력" 탭에서 한 행(row)의 입력값
export type UserDraftRow = {
   id: string;
   name: string;
   email: string;
   phone: string;
   role: UserRole;
};
