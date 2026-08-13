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

// /attendance/list는 소속 팀을 포함하지 않아서, 이미 사용 중인 /user/list(getUserList)에서
// 같은 userId의 훈련생을 찾아 teamName을 채운다
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

            const studentsById = new Map<number, UserListItem>();
            users
               .filter((user) => user.role === 'STUDENT')
               .forEach((user) => {
                  studentsById.set(user.userId, user);
               });

            setTrainees(
               list.map((item) => {
                  const matched = studentsById.get(item.userId);
                  return {
                     traineeId: item.userId,
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
   const [trendRetryKey, setTrendRetryKey] = useState(0);
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
      // trendRetryKey는 값 자체는 안 쓰고 재시도 버튼을 눌렀을 때 이 effect를 다시 돌리는 용도
   }, [selectedPeriodId, trendRetryKey]);

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

   const retryTrend = useCallback(() => {
      setIsLoadingTrend(true);
      setTrendError(false);
      setTrendRetryKey((key) => key + 1);
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
      retryTrend,
   };
}
