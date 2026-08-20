'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import {
   getPeriodErrorType,
   hasOrgDateOrderError,
   type PeriodErrorType,
} from '@/features/bootcamp-settings/hooks/bootcampPeriodValidation';
import {
   createBootcampInfo,
   createBootcampPolicy,
   patchBootcampInfo,
   type BootcampInfoPayload,
   type BootcampPolicyPeriod,
} from '@/services/onboarding.service';
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
   // 날짜 역전/기간 이탈/겹침 검증
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

function getOrgInfoDiff(saved: OrgInfoData, current: OrgInfoData): Partial<BootcampInfoPayload> {
   const diff: Partial<BootcampInfoPayload> = {};
   if (current.orgName !== saved.orgName) diff.orgName = current.orgName;
   if (current.courseName !== saved.courseName) diff.proName = current.courseName;
   if (current.startDate !== saved.startDate) diff.startDate = current.startDate;
   if (current.endDate !== saved.endDate) diff.endDate = current.endDate;
   return diff;
}

function getApiErrorMessage(err: unknown, fallback: string) {
   return err instanceof ApiError ? err.message : fallback;
}

export function useOnboardingWizard() {
   const router = useRouter();
   const { updateBootcampId } = useAuth();
   const [currentStep, setCurrentStep] = useState(1);
   const [orgInfo, setOrgInfo] = useState<OrgInfoData>(INITIAL_ORG_INFO);
   const [attendanceUnit, setAttendanceUnit] =
      useState<AttendanceUnitData>(INITIAL_ATTENDANCE_UNIT);
   const [warningCriteria, setWarningCriteria] =
      useState<WarningCriteriaData>(INITIAL_WARNING_CRITERIA);

   const [orgInfoSubmitAttempted, setOrgInfoSubmitAttempted] = useState(false);
   const [attendanceUnitSubmitAttempted, setAttendanceUnitSubmitAttempted] = useState(false);

   // 1단계 POST로 발급받은 부트캠프 ID
   const [bootcampId, setBootcampId] = useState<number | null>(null);
   const [savedOrgInfo, setSavedOrgInfo] = useState<OrgInfoData | null>(null);

   const [isSavingOrgInfo, setIsSavingOrgInfo] = useState(false);
   const [isCompleting, setIsCompleting] = useState(false);
   
   const isSavingOrgInfoRef = useRef(false);
   const isCompletingRef = useRef(false);

   const isCurrentStepValid =
      currentStep === 1
         ? isOrgInfoValid(orgInfo)
         : currentStep === 2
           ? isAttendanceUnitValid(attendanceUnit)
           : currentStep === 3
             ? isWarningCriteriaValid(warningCriteria)
             : true;

   const orgInfoDateError = orgInfoSubmitAttempted && hasOrgDateOrderError(orgInfo);

   // 기간 역전 / 부트캠프 기간 이탈 / 다른 단위기간과 겹침 / 양끝 경계
   const attendanceUnitPeriodErrors: Record<string, PeriodErrorType> = attendanceUnitSubmitAttempted
      ? Object.fromEntries(
           attendanceUnit.periods.map((period) => [
              period.id,
              getPeriodErrorType(period, attendanceUnit.periods, orgInfo),
           ]),
        )
      : {};

   const goToNextStep = async () => {
      if (!isCurrentStepValid) return;

      if (currentStep === 1) {
         if (hasOrgDateOrderError(orgInfo)) {
            setOrgInfoSubmitAttempted(true);
            return;
         }

         if (isSavingOrgInfoRef.current) return;
         isSavingOrgInfoRef.current = true;
         setIsSavingOrgInfo(true);
         try {
            if (bootcampId === null) {
               const { bootcampId: newBootcampId } = await createBootcampInfo({
                  orgName: orgInfo.orgName,
                  proName: orgInfo.courseName,
                  startDate: orgInfo.startDate,
                  endDate: orgInfo.endDate,
               });
               setBootcampId(newBootcampId);
               setSavedOrgInfo(orgInfo);
               // 전역 AuthContext의 bootcampId는 여기서 세팅하지 않는다 - 그 값이 곧
               // "온보딩 완료" 판정 기준(OnboardingWizardClient/RequireOnboardingGuard)으로
               // 재사용되고 있어서, 1단계만 마친 시점에 세팅하면 2~4단계를 건너뛰고 바로
               // 사이트로 튕겨나간다. 실제 온보딩이 끝나는 completeOnboarding에서만 세팅한다
            } else if (savedOrgInfo) {
               const diff = getOrgInfoDiff(savedOrgInfo, orgInfo);
               if (Object.keys(diff).length > 0) {
                  await patchBootcampInfo({ bootcampId, ...diff });
                  setSavedOrgInfo(orgInfo);
               }
            }
         } catch (err) {
            toast.error(
               getApiErrorMessage(
                  err,
                  '조직·과정 정보 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
               ),
            );
            return;
         } finally {
            isSavingOrgInfoRef.current = false;
            setIsSavingOrgInfo(false);
         }
      }

      if (currentStep === 2) {
         const hasAnyPeriodError = attendanceUnit.periods.some(
            (period) => getPeriodErrorType(period, attendanceUnit.periods, orgInfo) !== null,
         );
         if (hasAnyPeriodError) {
            setAttendanceUnitSubmitAttempted(true);
            return;
         }
      }

      setCurrentStep((step) => Math.min(step + 1, ONBOARDING_TOTAL_STEPS));
   };

   const goToPreviousStep = () => {
      setCurrentStep((step) => Math.max(step - 1, 1));
   };

   // 4단계 "완료" - 단위기간/경고·제적 기준을 등록하고 온보딩 마무리
   const completeOnboarding = async () => {
      if (!isCurrentStepValid || bootcampId === null) return;
      if (isCompletingRef.current) return;
      isCompletingRef.current = true;
      setIsCompleting(true);

      try {
         const periods: BootcampPolicyPeriod[] = [...attendanceUnit.periods]
            .sort((a, b) => a.startDate.localeCompare(b.startDate))
            .map((period, index) => ({
               periodNo: index + 1,
               periodStart: period.startDate,
               periodEnd: period.endDate,
            }));

         await createBootcampPolicy({
            bootcampId,
            periods,
            cautionPercent: Number(warningCriteria.cautionRate),
            warningPercent: Number(warningCriteria.warningRate),
            expulsionPercent: Number(warningCriteria.expulsionRiskRate),
         });

         // 온보딩이 실제로 끝난 시점 - 여기서만 전역 bootcampId를 세팅해 사이트 진입을 허용한다
         updateBootcampId(bootcampId);

         toast.success(
            `${orgInfo.orgName} - ${orgInfo.courseName}이(가) 성공적으로 등록되었습니다.`,
         );
         router.push('/');
      } catch (err) {
         toast.error(
            getApiErrorMessage(
               err,
               '출결 정책 등록 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
            ),
         );
      } finally {
         isCompletingRef.current = false;
         setIsCompleting(false);
      }
   };

   return {
      currentStep,
      isCurrentStepValid,
      goToNextStep,
      goToPreviousStep,
      completeOnboarding,
      isSavingOrgInfo,
      isCompleting,
      orgInfo,
      setOrgInfo,
      attendanceUnit,
      setAttendanceUnit,
      warningCriteria,
      setWarningCriteria,
      orgInfoDateError,
      attendanceUnitPeriodErrors,
   };
}
