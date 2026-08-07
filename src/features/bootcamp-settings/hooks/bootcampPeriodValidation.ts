import type { BootcampOrgInfo, BootcampPeriod } from '../types';

// 단위기간 하나에 걸릴 수 있는 에러 종류 - 한 번에 하나만 보여주면 되므로 우선순위대로 판단
export type PeriodErrorType =
   'order' | 'range' | 'overlap' | 'startBoundary' | 'endBoundary' | null;

export const PERIOD_ERROR_MESSAGES: Record<Exclude<PeriodErrorType, null>, string> = {
   order: '종료일은 시작일보다 빠를 수 없습니다.',
   range: '단위기간은 부트캠프 기간 내에 있어야 합니다.',
   overlap: '다른 단위기간과 기간이 겹칩니다.',
   startBoundary: '첫 단위기간 시작일은 부트캠프 시작일과 같아야 합니다.',
   endBoundary: '마지막 단위기간 종료일은 부트캠프 종료일과 같아야 합니다.',
};

// 부트캠프 시작일/종료일 자체가 뒤바뀌었는지
export function hasOrgDateOrderError(orgInfo: BootcampOrgInfo) {
   return (
      Boolean(orgInfo.startDate) && Boolean(orgInfo.endDate) && orgInfo.startDate > orgInfo.endDate
   );
}

function hasDateOrderError(period: BootcampPeriod) {
   return Boolean(period.startDate) && Boolean(period.endDate) && period.startDate > period.endDate;
}

// 단위기간이 부트캠프 전체 기간 안에 들어있는지 (날짜 둘 다 있어야 판단 가능)
function isOutOfBootcampRange(period: BootcampPeriod, orgInfo: BootcampOrgInfo) {
   if (!period.startDate || !period.endDate || !orgInfo.startDate || !orgInfo.endDate) return false;
   return period.startDate < orgInfo.startDate || period.endDate > orgInfo.endDate;
}

// 두 단위기간이 겹치는지 - 경계가 같은 날(한쪽 종료일 = 다른쪽 시작일)도 겹침으로 판정함
// (하루가 두 단위기간에 동시에 속할 수는 없다고 보고 처리 - 백엔드와 다르면 알려주세요)
function doPeriodsOverlap(a: BootcampPeriod, b: BootcampPeriod) {
   if (!a.startDate || !a.endDate || !b.startDate || !b.endDate) return false;
   return a.startDate <= b.endDate && b.startDate <= a.endDate;
}

// 가장 빠른 시작일을 가진 단위기간이 "첫 단위기간" - 그 시작일이 부트캠프 시작일과 다르면 에러
function isMissingStartBoundary(
   period: BootcampPeriod,
   allPeriods: BootcampPeriod[],
   orgInfo: BootcampOrgInfo,
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
   period: BootcampPeriod,
   allPeriods: BootcampPeriod[],
   orgInfo: BootcampOrgInfo,
) {
   if (!period.endDate || !orgInfo.endDate) return false;

   const datedPeriods = allPeriods.filter((p) => p.endDate);
   const latestEndDate = datedPeriods.reduce(
      (latest, p) => (p.endDate > latest ? p.endDate : latest),
      datedPeriods[0].endDate,
   );

   return period.endDate === latestEndDate && latestEndDate !== orgInfo.endDate;
}

export function getPeriodErrorType(
   period: BootcampPeriod,
   allPeriods: BootcampPeriod[],
   orgInfo: BootcampOrgInfo,
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
