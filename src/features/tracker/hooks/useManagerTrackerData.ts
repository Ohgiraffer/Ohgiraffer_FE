'use client';

import { useCallback, useEffect, useState } from 'react';
import { getUserList, type UserListItem } from '@/services/user.service';
import { getBootcampSettings, type BootcampSettingsPeriod } from '@/services/bootcampSettings.service';
import {
   getAttendanceDashboardSummary,
   getAttendanceList,
   getPresentAbsentCount,
   type AttendanceDashboardSummary,
   type PresentAbsentCountPoint,
} from '@/services/attendance.service';
import { mapRiskLevel, type TraineeSummary } from '../types';

// /attendance/list는 훈련생 이름만 내려주고 식별자·소속 팀은 포함하지 않아서, 이미 사용 중인
// /user/list(getUserList)에서 같은 이름의 훈련생을 찾아 userId·teamName을 채운다. 이름이 겹치면
// 매칭이 틀릴 수 있지만 현재로선 두 목록을 이어줄 다른 식별자가 없다
export function useManagerTrackerData() {
   const [stats, setStats] = useState<AttendanceDashboardSummary | null>(null);
   const [trainees, setTrainees] = useState<TraineeSummary[]>([]);
   const [periods, setPeriods] = useState<BootcampSettingsPeriod[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState(false);
   const [retryKey, setRetryKey] = useState(0);

   useEffect(() => {
      let isMounted = true;
      Promise.all([
         getAttendanceDashboardSummary(),
         getAttendanceList(),
         getUserList(),
         getBootcampSettings(),
      ])
         .then(([summary, list, users, bootcampSettings]) => {
            if (!isMounted) return;
            setStats(summary);
            setPeriods(bootcampSettings.periods);

            const studentsByName = new Map<string, UserListItem>();
            users
               .filter((user) => user.role === 'STUDENT')
               .forEach((user) => {
                  if (user.name) studentsByName.set(user.name, user);
               });

            setTrainees(
               list.map((item) => {
                  const matched = studentsByName.get(item.name);
                  return {
                     traineeId: matched?.userId ?? null,
                     name: item.name,
                     teamName: matched?.teamName ?? null,
                     attendanceRate: item.attendanceRate,
                     lateCount: item.lateCount,
                     earlyLeaveCount: item.earlyLeaveCount,
                     outingCount: item.outingCount,
                     absentCount: item.absentDays,
                     riskStatus: mapRiskLevel(item.status),
                  };
               }),
            );
         })
         .catch(() => {
            if (isMounted) setError(true);
         })
         .finally(() => {
            if (isMounted) setIsLoading(false);
         });
      return () => {
         isMounted = false;
      };
   }, [retryKey]);

   // 단위기간 추이 그래프 - null이면 백엔드 기본값(오늘이 속한 단위기간)을 그대로 쓴다
   const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
   const [trend, setTrend] = useState<PresentAbsentCountPoint[]>([]);
   const [isLoadingTrend, setIsLoadingTrend] = useState(true);
   const [trendError, setTrendError] = useState(false);

   useEffect(() => {
      let isMounted = true;
      getPresentAbsentCount(selectedPeriodId ?? undefined)
         .then((points) => {
            if (isMounted) setTrend(points);
         })
         .catch(() => {
            if (isMounted) setTrendError(true);
         })
         .finally(() => {
            if (isMounted) setIsLoadingTrend(false);
         });
      return () => {
         isMounted = false;
      };
   }, [selectedPeriodId]);

   const retry = useCallback(() => {
      setIsLoading(true);
      setError(false);
      setRetryKey((key) => key + 1);
   }, []);

   const changePeriod = useCallback((periodId: number | null) => {
      setIsLoadingTrend(true);
      setTrendError(false);
      setSelectedPeriodId(periodId);
   }, []);

   return {
      stats,
      trainees,
      periods,
      isLoading,
      error,
      retry,
      trend,
      isLoadingTrend,
      trendError,
      selectedPeriodId,
      changePeriod,
   };
}
