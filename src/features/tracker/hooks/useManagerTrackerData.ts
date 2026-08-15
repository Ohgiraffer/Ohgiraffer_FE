'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUserList, type UserListItem } from '@/services/user.service';
import { getBootcampSettings } from '@/services/bootcampSettings.service';
import {
   getAttendanceDashboardSummary,
   getAttendanceList,
   getPresentAbsentCount,
   type AttendanceDashboardSummary,
   type AttendanceListItem,
   type PresentAbsentCountPoint,
} from '@/services/attendance.service';
import { mapRiskLevel, type TraineeSummary } from '../types';

// /attendance/list는 소속 팀을 포함하지 않아서, 이미 사용 중인 /user/list(getUserList)에서
// 같은 userId의 훈련생을 찾아 teamName을 채운다
export function useManagerTrackerData() {
   const [stats, setStats] = useState<AttendanceDashboardSummary | null>(null);
   const [attendanceList, setAttendanceList] = useState<AttendanceListItem[] | null>(null);
   const [isLoadingAttendance, setIsLoadingAttendance] = useState(true);
   const [error, setError] = useState(false);
   const [retryKey, setRetryKey] = useState(0);

   // useUserList/useStudentDirectory/NewChatModal과 같은 queryKey를 써서 캐시를 공유한다
   const {
      data: users,
      isLoading: isLoadingUsers,
      isFetching: isFetchingUsers,
      isError: isUsersError,
      refetch: refetchUsers,
   } = useQuery({
      queryKey: ['users', 'list'],
      queryFn: getUserList,
   });

   // useOrgAttendanceSettings/TeamPeriodAddModal과 같은 queryKey를 써서 캐시를 공유한다
   const {
      data: bootcampSettings,
      isLoading: isLoadingBootcampSettings,
      isFetching: isFetchingBootcampSettings,
      isError: isBootcampSettingsError,
      refetch: refetchBootcampSettings,
   } = useQuery({
      queryKey: ['bootcampSettings'],
      queryFn: getBootcampSettings,
   });
   const periods = useMemo(() => bootcampSettings?.periods ?? [], [bootcampSettings]);

   useEffect(() => {
      let isMounted = true;
      Promise.all([getAttendanceDashboardSummary(), getAttendanceList()])
         .then(([summary, list]) => {
            if (!isMounted) return;
            setStats(summary);
            setAttendanceList(list);
         })
         .catch(() => {
            if (isMounted) setError(true);
         })
         .finally(() => {
            if (isMounted) setIsLoadingAttendance(false);
         });
      return () => {
         isMounted = false;
      };
   }, [retryKey]);

   // retry()로 재조회하는 동안(isFetching)에도 로딩으로 보여준다 - 그렇지 않으면 재조회가 끝날
   // 때까지 이전 에러 상태(isError)가 그대로 남아 "다시 시도"를 눌러도 에러 화면이 계속 보인다
   const isLoading =
      isLoadingAttendance ||
      isLoadingUsers ||
      isLoadingBootcampSettings ||
      isFetchingUsers ||
      isFetchingBootcampSettings;
   const hasError = error || isUsersError || isBootcampSettingsError;

   const trainees = useMemo<TraineeSummary[]>(() => {
      if (!attendanceList || !users) return [];

      const studentsById = new Map<number, UserListItem>();
      users
         .filter((user) => user.role === 'STUDENT')
         .forEach((user) => {
            studentsById.set(user.userId, user);
         });

      return attendanceList.map((item) => {
         const matched = studentsById.get(item.userId);
         return {
            traineeId: item.userId,
            name: item.name,
            email: matched?.email ?? null,
            teamName: matched?.teamName ?? null,
            attendanceRate: item.attendanceRate,
            lateCount: item.lateCount,
            earlyLeaveCount: item.earlyLeaveCount,
            outingCount: item.outingCount,
            absentCount: item.absentDays,
            riskStatus: mapRiskLevel(item.status),
         };
      });
   }, [attendanceList, users]);

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
      setIsLoadingAttendance(true);
      setError(false);
      setRetryKey((key) => key + 1);
      refetchUsers();
      refetchBootcampSettings();
   }, [refetchUsers, refetchBootcampSettings]);

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
      error: hasError,
      retry,
      trend,
      isLoadingTrend,
      trendError,
      selectedPeriodId,
      changePeriod,
      retryTrend,
   };
}
