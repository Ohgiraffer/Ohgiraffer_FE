import type { BootcampOrgInfo, BootcampPeriod } from '@/features/bootcamp-settings/types';

export type OrgInfoData = BootcampOrgInfo;

export type AttendanceUnitPeriod = BootcampPeriod;

export type AttendanceUnitData = {
   periods: AttendanceUnitPeriod[];
};

export type WarningCriteriaData = {
   cautionRate: string;
   warningRate: string;
   expulsionRiskRate: string;
};

export const ONBOARDING_TOTAL_STEPS = 4;
