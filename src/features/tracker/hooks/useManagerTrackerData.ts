'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import type { ServerManagerTrackerData } from '../getServerManagerTrackerData';

// /attendance/list는 소속 팀을 포함하지 않아서, 이미 사용 중인 /user/list(getUserList)에서
// 같은 userId의 훈련생을 찾아 teamName을 채운다
export function useManagerTrackerData(initial?: ServerManagerTrackerData) {
   const [stats, setStats] = useState<AttendanceDashboardSummary | null>(
      initial?.initialStats ?? null,
   );
   const [attendanceList, setAttendanceList] = useState<AttendanceListItem[] | null>(
      initial?.initialAttendanceList ?? null,
   );
   const [isLoadingAttendance, setIsLoadingAttendance] = useState(!initial);
   const [error, setError] = useState(false);
   const [retryKey, setRetryKey] = useState(0);
   // 서버가 이미 초기 데이터를 넘겨줬으면, 마운트 시점의 첫 조회 한 번은 건너뛴다
   const skipInitialAttendanceFetchRef = useRef(initial != null);

   // useUserList/useStudentDirectory/NewChatModal과 같은 queryKey를 써서 캐시를 공유한다
   const {
      data: users,
      isLoading: isLoadingUsers,
      isError: isUsersError,
      refetch: refetchUsers,
   } = useQuery({
      queryKey: ['users', 'list'],
      queryFn: getUserList,
      initialData: initial?.initialUsers,
   });

   // useOrgAttendanceSettings/TeamPeriodAddModal과 같은 queryKey를 써서 캐시를 공유한다
   const {
      data: bootcampSettings,
      isLoading: isLoadingBootcampSettings,
      isError: isBootcampSettingsError,
      refetch: refetchBootcampSettings,
   } = useQuery({
      queryKey: ['bootcampSettings'],
      queryFn: getBootcampSettings,
      initialData: initial?.initialBootcampSettings,
   });
   const periods = useMemo(() => bootcampSettings?.periods ?? [], [bootcampSettings]);

   // retry() 중에만 켜는 별도 플래그 - isFetchingUsers/isFetchingBootcampSettings를 isLoading에
   // 직접 섞으면, initialData로 마운트된 직후 react-query가 자동으로 돌리는 배경 재검증
   // (staleTime 기본값 0)에도 걸려서 프리페치가 성공했는데도 스켈레톤이 한 번 더 번쩍인다
   const [isRetrying, setIsRetrying] = useState(false);
   const isMountedRef = useRef(true);
   useEffect(() => {
      // StrictMode 개발 모드는 마운트 시 setup -> cleanup -> setup 순서로 두 번 실행한다.
      // 첫 cleanup이 false로 내려버린 뒤 두 번째 setup에서 다시 true로 되돌리지 않으면,
      // 이후 retry()가 isMountedRef.current를 영원히 false로 착각해 isRetrying이 안 꺼진다
      isMountedRef.current = true;
      return () => {
         isMountedRef.current = false;
      };
   }, []);

   useEffect(() => {
      if (skipInitialAttendanceFetchRef.current) {
         skipInitialAttendanceFetchRef.current = false;
         return;
      }
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

   // retry()로 재조회하는 동안(isRetrying)에도 로딩으로 보여준다 - 그렇지 않으면 재조회가 끝날
   // 때까지 이전 에러 상태(isError)가 그대로 남아 "다시 시도"를 눌러도 에러 화면이 계속 보인다
   const isLoading =
      isLoadingAttendance || isLoadingUsers || isLoadingBootcampSettings || isRetrying;
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
   const [trend, setTrend] = useState<PresentAbsentCountPoint[]>(initial?.initialTrend ?? []);
   const [isLoadingTrend, setIsLoadingTrend] = useState(!initial);
   const [trendError, setTrendError] = useState(false);
   // selectedPeriodId가 null(기본값)일 때의 첫 조회만 건너뛴다 - 프리페치도 periodId 없는
   // 기본값 기준이었으므로
   const skipInitialTrendFetchRef = useRef(initial != null);

   useEffect(() => {
      if (skipInitialTrendFetchRef.current) {
         skipInitialTrendFetchRef.current = false;
         return;
      }
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
      setIsRetrying(true);
      Promise.allSettled([refetchUsers(), refetchBootcampSettings()]).finally(() => {
         if (isMountedRef.current) setIsRetrying(false);
      });
   }, [refetchUsers, refetchBootcampSettings]);

   const changePeriod = useCallback(
      (periodId: number | null) => {
         // 이미 선택된 기간이면 아무것도 안 한다 - setSelectedPeriodId(같은 값)은 상태가 안 바뀌어
         // 재조회 useEffect가 다시 안 도는데, 그 위에서 setIsLoadingTrend(true)만 무조건 실행되면
         // 로딩 상태를 꺼줄 효과가 다시 안 돌아 "불러오는 중"에 영원히 머문다
         if (periodId === selectedPeriodId) return;
         setIsLoadingTrend(true);
         setTrendError(false);
         setSelectedPeriodId(periodId);
      },
      [selectedPeriodId],
   );

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
