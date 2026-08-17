'use client';

import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
   getMyAttendanceMonthly,
   getMyAttendanceSummary,
   getMyLeaveSickCount,
   getStudentAttendanceMonthly,
   getStudentAttendanceSummary,
   getStudentLeaveSickCount,
} from '@/services/attendance.service';
import { mapRiskLevel, type AttendanceDayRecord, type StudentAttendanceOverview } from '../types';

// userId를 주면 운영진용 특정 훈련생 조회(/attendance/summary/{userId} 등), 안 주면 본인 조회
// API(/attendance/summary 등)를 쓴다 - 훈련생 본인 화면과 훈련생 상세 페이지의 출결 탭이 공용으로 쓴다
export function useAttendanceOverview(userId?: number) {
   const [overview, setOverview] = useState<Omit<StudentAttendanceOverview, 'todayStatus' | 'checkInTime'> | null>(
      null,
   );
   const [isLoadingOverview, setIsLoadingOverview] = useState(true);
   const [overviewError, setOverviewError] = useState(false);
   const [overviewRetryKey, setOverviewRetryKey] = useState(0);

   const [currentDate, setCurrentDate] = useState(() => new Date());
   const [records, setRecords] = useState<AttendanceDayRecord[]>([]);
   const [isLoadingRecords, setIsLoadingRecords] = useState(true);
   const [recordsError, setRecordsError] = useState(false);

   // "오늘" 상태는 달력이 보여주는 월과 무관하게 고정 - 달력 월을 옮겨도 이 값은 그대로 유지된다
   const [todayStatus, setTodayStatus] = useState<AttendanceDayRecord['status']>(null);
   const [checkInTime, setCheckInTime] = useState<string | null>(null);

   // userId가 바뀌면(훈련생 상세 페이지에서 다른 훈련생으로 이동) 이전 훈련생의 데이터를 먼저
   // 비운다 - 안 그러면 새 요청이 끝날 때까지 이전 훈련생의 출결 정보가 그대로 남는다. 이펙트
   // 안에서 동기 setState를 하면 안 되므로 렌더 중 상태 조정 패턴을 쓴다(TeamWorkspaceLink와 동일)
   const [trackedUserId, setTrackedUserId] = useState(userId);
   if (userId !== trackedUserId) {
      setTrackedUserId(userId);
      setOverview(null);
      setIsLoadingOverview(true);
      setOverviewError(false);
      setCurrentDate(new Date());
      setRecords([]);
      setIsLoadingRecords(true);
      setRecordsError(false);
      setTodayStatus(null);
      setCheckInTime(null);
   }

   useEffect(() => {
      let isMounted = true;
      Promise.all([
         userId != null ? getStudentAttendanceSummary(userId) : getMyAttendanceSummary(),
         userId != null ? getStudentLeaveSickCount(userId) : getMyLeaveSickCount(),
      ])
         .then(([summary, leaveSick]) => {
            if (!isMounted) return;
            setOverview({
               remainingVacation: leaveSick.remainingLeaveDays,
               remainingSickLeave: leaveSick.remainingSickDays,
               attendanceRate: summary.attendanceRate,
               present: summary.presentDays,
               late: summary.lateCount,
               earlyLeave: summary.earlyLeaveCount,
               outing: summary.outingCount,
               absent: summary.absentDays,
               vacation: summary.leaveDays,
               sickLeave: summary.sickDays,
               riskStatus: mapRiskLevel(summary.riskLevel),
               periodRates: summary.periodRates,
            });
         })
         .catch(() => {
            if (isMounted) setOverviewError(true);
         })
         .finally(() => {
            if (isMounted) setIsLoadingOverview(false);
         });
      return () => {
         isMounted = false;
      };
   }, [userId, overviewRetryKey]);

   useEffect(() => {
      let isMounted = true;
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      (userId != null
         ? getStudentAttendanceMonthly(userId, year, month)
         : getMyAttendanceMonthly(year, month)
      )
         .then((res) => {
            if (!isMounted) return;
            setRecords(res.days);
            if (res.yearMonth === format(new Date(), 'yyyy-MM')) {
               const todayStr = format(new Date(), 'yyyy-MM-dd');
               const today = res.days.find((day) => day.date === todayStr);
               setTodayStatus(today?.status ?? null);
               setCheckInTime(today?.checkInTime ?? null);
            }
         })
         .catch(() => {
            if (!isMounted) return;
            setRecordsError(true);
            // currentDate는 이미 새 달로 바뀐 상태라, 이전 달 기록을 그대로 두면 새 달 헤더 밑에
            // 옛 달의 출결 표시가 남는다 - 실패 시엔 비워서 잘못된 데이터를 보여주지 않는다
            setRecords([]);
         })
         .finally(() => {
            if (isMounted) setIsLoadingRecords(false);
         });
      return () => {
         isMounted = false;
      };
   }, [userId, currentDate]);

   const retryOverview = useCallback(() => {
      setIsLoadingOverview(true);
      setOverviewError(false);
      setOverviewRetryKey((key) => key + 1);
   }, []);

   // 달력에서 월을 옮길 때 - 다음 useEffect가 새로 fetch를 시작하기 전에 로딩 상태부터 켠다
   const changeMonth = useCallback((date: Date) => {
      setIsLoadingRecords(true);
      setRecordsError(false);
      setCurrentDate(date);
   }, []);

   const fullOverview: StudentAttendanceOverview | null = overview
      ? { ...overview, todayStatus, checkInTime }
      : null;

   return {
      overview: fullOverview,
      isLoadingOverview,
      overviewError,
      retryOverview,
      currentDate,
      setCurrentDate: changeMonth,
      records,
      isLoadingRecords,
      recordsError,
   };
}
