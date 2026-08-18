'use client';

import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
   const queryClient = useQueryClient();
   // useManagerTrackerData/TeamPeriodAddModal과 같은 queryKey를 써서 캐시를 공유한다
   const {
      data,
      isLoading,
      error,
   } = useQuery({
      queryKey: ['bootcampSettings'],
      queryFn: getBootcampSettings,
   });
   const loadError = error
      ? getApiErrorMessage(error, '설정 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
      : null;

   const [orgInfo, setOrgInfo] = useState<BootcampOrgInfo>({
      orgName: '',
      courseName: '',
      startDate: '',
      endDate: '',
   });
   const [periods, setPeriods] = useState<BootcampPeriod[]>([]);
   const [isDirty, setIsDirty] = useState(false);
   const [submitAttempted, setSubmitAttempted] = useState(false);

   const [isSaving, setIsSaving] = useState(false);

   const isSavingRef = useRef(false);

   // 쿼리 데이터가 도착하면 폼 초기값으로 한 번만 채운다(이후엔 사용자 편집이 우선이라 다시 덮어쓰지 않는다).
   // effect 안에서 setState를 직접 호출할 수 없어(react-hooks/set-state-in-effect) 렌더 중에 처리한다
   const [hasSeeded, setHasSeeded] = useState(false);
   if (!hasSeeded && data) {
      setHasSeeded(true);
      setOrgInfo({
         orgName: data.orgName,
         courseName: data.proName,
         startDate: data.startDate,
         endDate: data.endDate,
      });
      setPeriods(data.periods.map(toLocalPeriod));
   }

   const updateOrgInfo = (value: BootcampOrgInfo) => {
      setOrgInfo(value);
      setIsDirty(true);
   };

   const updatePeriods = (value: BootcampPeriod[]) => {
      setPeriods(value);
      setIsDirty(true);
   };

   const orgInfoDateError = submitAttempted && hasOrgDateOrderError(orgInfo);

   // 기간 역전 / 부트캠프 기간 이탈 / 다른 단위기간과 겹침 / 양끝 경계 - 온보딩과 동일한 기준
   const periodErrors: Record<string, PeriodErrorType> = submitAttempted
      ? Object.fromEntries(
           periods.map((period) => [period.id, getPeriodErrorType(period, periods, orgInfo)]),
        )
      : {};

   // *(필수) 항목들 - 하나라도 비면 저장 자체를 비활
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
         const sortedLocalPeriods = [...periods].sort((a, b) =>
            a.startDate.localeCompare(b.startDate),
         );
         const sortedPeriods = sortedLocalPeriods.map((period, index) => ({
            periodNo: index + 1,
            periodStart: period.startDate,
            periodEnd: period.endDate,
         }));

         // 부분 수정이 아니라 전체 교체라 항상 모든 필드
         await updateBootcampSettings({
            orgName: orgInfo.orgName,
            proName: orgInfo.courseName,
            startDate: orgInfo.startDate,
            endDate: orgInfo.endDate,
            periods: sortedPeriods,
         });

         toast.success('조직·출결 설정이 저장되었습니다.');

         setPeriods(sortedLocalPeriods);
         setIsDirty(false);
         setSubmitAttempted(false);
         queryClient.invalidateQueries({ queryKey: ['bootcampSettings'] });
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
