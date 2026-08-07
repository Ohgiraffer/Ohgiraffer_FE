'use client';

import { useEffect, useRef, useState } from 'react';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import {
   getPeriodErrorType,
   hasOrgDateOrderError,
   type PeriodErrorType,
} from '@/features/bootcamp-settings/hooks/bootcampPeriodValidation';
import type { BootcampOrgInfo, BootcampPeriod } from '@/features/bootcamp-settings/types';
import {
   getBootcampSettings,
   updateBootcampSettings,
   type BootcampSettingsPeriod,
} from '@/services/bootcampSettings.service';

function toLocalPeriod(period: BootcampSettingsPeriod): BootcampPeriod {
   return { id: crypto.randomUUID(), startDate: period.periodStart, endDate: period.periodEnd };
}

function getApiErrorMessage(err: unknown, fallback: string) {
   return err instanceof ApiError ? err.message : fallback;
}

export function useOrgAttendanceSettings() {
   const [isLoading, setIsLoading] = useState(true);
   const [loadError, setLoadError] = useState<string | null>(null);

   const [orgInfo, setOrgInfo] = useState<BootcampOrgInfo>({
      orgName: '',
      courseName: '',
      startDate: '',
      endDate: '',
   });
   const [periods, setPeriods] = useState<BootcampPeriod[]>([]);
   const [isDirty, setIsDirty] = useState(false);
   // "저장"을 한 번이라도 눌러본 적 있는지 - 그 이후부터 에러 메시지를 실시간으로 보여주기 위한 플래그
   const [submitAttempted, setSubmitAttempted] = useState(false);

   const [isSaving, setIsSaving] = useState(false);
   // 더블클릭으로 인한 중복 요청 방지 - state는 비동기라 클릭 시점에 바로 막아줄 동기 가드가 필요
   const isSavingRef = useRef(false);

   useEffect(() => {
      let isMounted = true;

      getBootcampSettings()
         .then((data) => {
            if (!isMounted) return;
            setOrgInfo({
               orgName: data.orgName,
               courseName: data.proName,
               startDate: data.startDate,
               endDate: data.endDate,
            });
            setPeriods(data.periods.map(toLocalPeriod));
         })
         .catch((err) => {
            if (!isMounted) return;
            setLoadError(
               getApiErrorMessage(
                  err,
                  '설정 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
               ),
            );
         })
         .finally(() => {
            if (isMounted) setIsLoading(false);
         });

      return () => {
         isMounted = false;
      };
   }, []);

   const updateOrgInfo = (value: BootcampOrgInfo) => {
      setOrgInfo(value);
      setIsDirty(true);
   };

   const updatePeriods = (value: BootcampPeriod[]) => {
      setPeriods(value);
      setIsDirty(true);
   };

   const orgInfoDateError = submitAttempted && hasOrgDateOrderError(orgInfo);

   // 기간 역전 / 부트캠프 기간 이탈 / 다른 단위기간과 겹침 / 양끝 경계 - 온보딩과 동일한 기준으로 검증
   const periodErrors: Record<string, PeriodErrorType> = submitAttempted
      ? Object.fromEntries(
           periods.map((period) => [period.id, getPeriodErrorType(period, periods, orgInfo)]),
        )
      : {};

   // *(필수) 표시된 항목들 - 하나라도 비면 저장 자체를 막는다 (날짜 순서 등은 저장 시점에 별도 안내)
   const isOrgInfoFilled = Boolean(
      orgInfo.orgName.trim() && orgInfo.courseName.trim() && orgInfo.startDate && orgInfo.endDate,
   );
   const isPeriodsFilled =
      periods.length > 0 && periods.every((period) => period.startDate && period.endDate);
   const isSaveEnabled = isDirty && isOrgInfoFilled && isPeriodsFilled && !isSaving;

   const handleSave = async () => {
      if (!isOrgInfoFilled || !isPeriodsFilled) return;

      const hasAnyError =
         hasOrgDateOrderError(orgInfo) ||
         periods.some((period) => getPeriodErrorType(period, periods, orgInfo) !== null);
      if (hasAnyError) {
         setSubmitAttempted(true);
         return;
      }

      if (isSavingRef.current) return;
      isSavingRef.current = true;
      setIsSaving(true);

      try {
         // periodNo는 화면에 추가한 순서가 아니라 실제 날짜 순서를 따르도록 시작일 기준으로 재정렬
         const sortedLocalPeriods = [...periods].sort((a, b) =>
            a.startDate.localeCompare(b.startDate),
         );
         const sortedPeriods = sortedLocalPeriods.map((period, index) => ({
            periodNo: index + 1,
            periodStart: period.startDate,
            periodEnd: period.endDate,
         }));

         // 부분 수정이 아니라 전체 교체라 항상 모든 필드를 다 담아 보낸다
         await updateBootcampSettings({
            orgName: orgInfo.orgName,
            proName: orgInfo.courseName,
            startDate: orgInfo.startDate,
            endDate: orgInfo.endDate,
            periods: sortedPeriods,
         });

         toast.success('조직·출결 설정이 저장되었습니다.');
         // 화면에 보여줄 순번도 방금 서버에 저장한 순서(날짜순)로 맞춰야, 새로고침 시 순번이 갑자기 바뀌지 않는다
         setPeriods(sortedLocalPeriods);
         setIsDirty(false);
         setSubmitAttempted(false);
      } catch (err) {
         toast.error(
            getApiErrorMessage(err, '설정 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'),
         );
      } finally {
         isSavingRef.current = false;
         setIsSaving(false);
      }
   };

   return {
      isLoading,
      loadError,
      orgInfo,
      updateOrgInfo,
      periods,
      updatePeriods,
      orgInfoDateError,
      periodErrors,
      isSaveEnabled,
      isSaving,
      handleSave,
   };
}
