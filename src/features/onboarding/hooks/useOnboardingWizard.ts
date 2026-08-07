'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
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
   type AttendanceUnitPeriod,
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

// 단위기간 하나에 걸릴 수 있는 에러 종류 - 한 번에 하나만 보여주면 되므로 우선순위대로 판단
export type PeriodErrorType =
   'order' | 'range' | 'overlap' | 'startBoundary' | 'endBoundary' | null;

function isOrgInfoValid(data: OrgInfoData) {
   return Boolean(data.orgName.trim() && data.courseName.trim() && data.startDate && data.endDate);
}

function isAttendanceUnitValid(data: AttendanceUnitData) {
   // 날짜 역전/기간 이탈/겹침 검증은 "다음" 클릭 시 에러 메시지로 안내하기 위해 여기서는 값 존재 여부만 확인
   return (
      data.periods.length > 0 && data.periods.every((period) => period.startDate && period.endDate)
   );
}

function hasDateOrderError(period: AttendanceUnitPeriod) {
   return Boolean(period.startDate) && Boolean(period.endDate) && period.startDate > period.endDate;
}

// 단위기간이 1단계에서 지정한 부트캠프 기간 안에 들어있는지 (날짜 둘 다 있어야 판단 가능)
function isOutOfBootcampRange(period: AttendanceUnitPeriod, orgInfo: OrgInfoData) {
   if (!period.startDate || !period.endDate || !orgInfo.startDate || !orgInfo.endDate) return false;
   return period.startDate < orgInfo.startDate || period.endDate > orgInfo.endDate;
}

// 두 단위기간이 겹치는지 - 경계가 같은 날(한쪽 종료일 = 다른쪽 시작일)도 겹침으로 판정함
// (하루가 두 단위기간에 동시에 속할 수는 없다고 보고 처리 - 백엔드와 다르면 알려주세요)
function doPeriodsOverlap(a: AttendanceUnitPeriod, b: AttendanceUnitPeriod) {
   if (!a.startDate || !a.endDate || !b.startDate || !b.endDate) return false;
   return a.startDate <= b.endDate && b.startDate <= a.endDate;
}

// 가장 빠른 시작일을 가진 단위기간이 "첫 단위기간" - 그 시작일이 부트캠프 시작일과 다르면 에러
function isMissingStartBoundary(
   period: AttendanceUnitPeriod,
   allPeriods: AttendanceUnitPeriod[],
   orgInfo: OrgInfoData,
) {
   if (!period.startDate || !orgInfo.startDate) return false;

   const datedPeriods = allPeriods.filter((p) => p.startDate);
   const earliestStartDate = datedPeriods.reduce(
      (earliest, p) => (p.startDate < earliest ? p.startDate : earliest),
      datedPeriods[0].startDate,
   );

   return period.startDate === earliestStartDate && earliestStartDate !== orgInfo.startDate;
}

// 가장 늦은 종료일을 가진 단위기간이 "마지막 단위기간" - 그 종료일이 부트캠프 종료일과 다르면 에러
function isMissingEndBoundary(
   period: AttendanceUnitPeriod,
   allPeriods: AttendanceUnitPeriod[],
   orgInfo: OrgInfoData,
) {
   if (!period.endDate || !orgInfo.endDate) return false;

   const datedPeriods = allPeriods.filter((p) => p.endDate);
   const latestEndDate = datedPeriods.reduce(
      (latest, p) => (p.endDate > latest ? p.endDate : latest),
      datedPeriods[0].endDate,
   );

   return period.endDate === latestEndDate && latestEndDate !== orgInfo.endDate;
}

function getPeriodErrorType(
   period: AttendanceUnitPeriod,
   allPeriods: AttendanceUnitPeriod[],
   orgInfo: OrgInfoData,
): PeriodErrorType {
   if (hasDateOrderError(period)) return 'order';
   if (isOutOfBootcampRange(period, orgInfo)) return 'range';
   if (allPeriods.some((other) => other.id !== period.id && doPeriodsOverlap(period, other))) {
      return 'overlap';
   }
   if (isMissingStartBoundary(period, allPeriods, orgInfo)) return 'startBoundary';
   if (isMissingEndBoundary(period, allPeriods, orgInfo)) return 'endBoundary';
   return null;
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

// 1단계 재방문(이전→수정→다음) 시 실제로 바뀐 필드만 PATCH로 보내기 위한 diff
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
   const [currentStep, setCurrentStep] = useState(1);
   const [orgInfo, setOrgInfo] = useState<OrgInfoData>(INITIAL_ORG_INFO);
   const [attendanceUnit, setAttendanceUnit] =
      useState<AttendanceUnitData>(INITIAL_ATTENDANCE_UNIT);
   const [warningCriteria, setWarningCriteria] =
      useState<WarningCriteriaData>(INITIAL_WARNING_CRITERIA);

   // "다음"을 한 번이라도 눌러본 적 있는지 - 시작일/종료일 역전 에러를 그 이후부터 실시간으로 보여주기 위한 플래그
   const [orgInfoSubmitAttempted, setOrgInfoSubmitAttempted] = useState(false);
   const [attendanceUnitSubmitAttempted, setAttendanceUnitSubmitAttempted] = useState(false);

   // 1단계 POST로 발급받은 부트캠프 ID - 이후 PATCH/POST 요청에 계속 실어 보냄
   const [bootcampId, setBootcampId] = useState<number | null>(null);
   // 마지막으로 백엔드에 성공적으로 저장된 1단계 값의 스냅샷 - [이전]으로 돌아가 수정한 뒤
   // 다시 "다음"을 누를 때 이 값과 비교해 바뀐 필드만 PATCH로 보낸다
   const [savedOrgInfo, setSavedOrgInfo] = useState<OrgInfoData | null>(null);

   const [isSavingOrgInfo, setIsSavingOrgInfo] = useState(false);
   const [isCompleting, setIsCompleting] = useState(false);
   // 더블클릭으로 인한 중복 요청 방지 - state는 비동기라 클릭 시점에 바로 막아줄 동기 가드가 필요
   const isSavingOrgInfoRef = useRef(false);
   const isCompletingRef = useRef(false);

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

   // 기간 역전 / 부트캠프 기간 이탈 / 다른 단위기간과 겹침 / 양끝 경계 - 네 가지를 한 번에 계산해서 기간별로 하나씩만 보여줌
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
         if (orgInfo.startDate > orgInfo.endDate) {
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

   // 4단계 "완료" - 단위기간/경고·제적 기준을 등록하고 온보딩을 마무리
   const completeOnboarding = async () => {
      if (!isCurrentStepValid || bootcampId === null) return;
      if (isCompletingRef.current) return;
      isCompletingRef.current = true;
      setIsCompleting(true);

      try {
         // periodNo는 화면에 추가한 순서가 아니라 실제 날짜 순서를 따르도록 시작일 기준으로 재정렬
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

         // 등록 응답에 별도 데이터가 없어(성공 시 응답 X), 화면에 이미 있는 조직명·과정명으로 메시지를 구성
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
