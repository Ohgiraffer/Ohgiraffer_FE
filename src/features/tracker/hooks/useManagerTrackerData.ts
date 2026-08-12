'use client';

import { useCallback, useEffect, useState } from 'react';
import { getUserList, type UserListItem } from '@/services/user.service';
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
   const [trend, setTrend] = useState<PresentAbsentCountPoint[]>([]);
   const [trainees, setTrainees] = useState<TraineeSummary[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState(false);
   const [retryKey, setRetryKey] = useState(0);

   useEffect(() => {
      let isMounted = true;
      Promise.all([getAttendanceDashboardSummary(), getPresentAbsentCount(), getAttendanceList(), getUserList()])
         .then(([summary, trendPoints, list, users]) => {
            if (!isMounted) return;
            setStats(summary);
            setTrend(trendPoints);

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

   const retry = useCallback(() => {
      setIsLoading(true);
      setError(false);
      setRetryKey((key) => key + 1);
   }, []);

   return { stats, trend, trainees, isLoading, error, retry };
}
