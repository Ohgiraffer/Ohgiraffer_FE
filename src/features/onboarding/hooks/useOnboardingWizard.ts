'use client';

import { useState } from 'react';
import {
   ONBOARDING_TOTAL_STEPS,
   type AttendanceUnitData,
   type OrgInfoData,
   type WarningCriteriaData,
} from '../types';

const INITIAL_ORG_INFO: OrgInfoData = {
   orgName: '',
   courseName: '',
   startDate: '',
   endDate: '',
};

const INITIAL_ATTENDANCE_UNIT: AttendanceUnitData = {
   periods: [],
};

const INITIAL_WARNING_CRITERIA: WarningCriteriaData = {
   cautionRate: '',
   warningRate: '',
   expulsionRiskRate: '',
};

function isOrgInfoValid(data: OrgInfoData) {
   return Boolean(data.orgName.trim() && data.courseName.trim() && data.startDate && data.endDate);
}

function isAttendanceUnitValid(data: AttendanceUnitData) {
   // 시작일 <= 종료일 검증은 "다음" 클릭 시 에러 메시지로 안내하기 위해 여기서는 값 존재 여부만 확인
   return (
      data.periods.length > 0 && data.periods.every((period) => period.startDate && period.endDate)
   );
}

function isValidPercent(value: string) {
   if (!value.trim()) return false;
   const num = Number(value);
   return !Number.isNaN(num) && num >= 0 && num <= 100;
}

function isWarningCriteriaValid(data: WarningCriteriaData) {
   return (
      isValidPercent(data.cautionRate) &&
      isValidPercent(data.warningRate) &&
      isValidPercent(data.expulsionRiskRate)
   );
}

export function useOnboardingWizard() {
   const [currentStep, setCurrentStep] = useState(1);
   const [orgInfo, setOrgInfo] = useState<OrgInfoData>(INITIAL_ORG_INFO);
   const [attendanceUnit, setAttendanceUnit] =
      useState<AttendanceUnitData>(INITIAL_ATTENDANCE_UNIT);
   const [warningCriteria, setWarningCriteria] =
      useState<WarningCriteriaData>(INITIAL_WARNING_CRITERIA);

   // "다음"을 한 번이라도 눌러본 적 있는지 - 시작일/종료일 역전 에러를 그 이후부터 실시간으로 보여주기 위한 플래그
   const [orgInfoSubmitAttempted, setOrgInfoSubmitAttempted] = useState(false);
   const [attendanceUnitSubmitAttempted, setAttendanceUnitSubmitAttempted] = useState(false);

   // Step4는 입력 항목이 없는 읽기 전용 확인 화면이라 항상 통과 처리
   const isCurrentStepValid =
      currentStep === 1
         ? isOrgInfoValid(orgInfo)
         : currentStep === 2
           ? isAttendanceUnitValid(attendanceUnit)
           : currentStep === 3
             ? isWarningCriteriaValid(warningCriteria)
             : true;

   const orgInfoDateError =
      orgInfoSubmitAttempted &&
      Boolean(orgInfo.startDate) &&
      Boolean(orgInfo.endDate) &&
      orgInfo.startDate > orgInfo.endDate;

   const attendanceUnitDateErrors: Record<string, boolean> = attendanceUnitSubmitAttempted
      ? Object.fromEntries(
           attendanceUnit.periods.map((period) => [
              period.id,
              Boolean(period.startDate) &&
                 Boolean(period.endDate) &&
                 period.startDate > period.endDate,
           ]),
        )
      : {};

   const goToNextStep = () => {
      if (!isCurrentStepValid) return;

      if (currentStep === 1 && orgInfo.startDate > orgInfo.endDate) {
         setOrgInfoSubmitAttempted(true);
         return;
      }

      if (currentStep === 2) {
         const hasDateOrderError = attendanceUnit.periods.some(
            (period) => period.startDate > period.endDate,
         );
         if (hasDateOrderError) {
            setAttendanceUnitSubmitAttempted(true);
            return;
         }
      }

      setCurrentStep((step) => Math.min(step + 1, ONBOARDING_TOTAL_STEPS));
   };

   const goToPreviousStep = () => {
      setCurrentStep((step) => Math.max(step - 1, 1));
   };

   return {
      currentStep,
      isCurrentStepValid,
      goToNextStep,
      goToPreviousStep,
      orgInfo,
      setOrgInfo,
      attendanceUnit,
      setAttendanceUnit,
      warningCriteria,
      setWarningCriteria,
      orgInfoDateError,
      attendanceUnitDateErrors,
   };
}
