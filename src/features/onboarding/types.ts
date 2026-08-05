export type OrgInfoData = {
   orgName: string;
   courseName: string;
   startDate: string;
   endDate: string;
};

export type AttendanceUnitPeriod = {
   id: string;
   startDate: string;
   endDate: string;
};

export type AttendanceUnitData = {
   periods: AttendanceUnitPeriod[];
};

export type WarningCriteriaData = {
   cautionRate: string;
   warningRate: string;
   expulsionRiskRate: string;
};

export const ONBOARDING_TOTAL_STEPS = 4;
