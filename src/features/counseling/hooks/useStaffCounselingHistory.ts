'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import type { UserRole } from '@/services/auth.service';
import {
   getConsultationHistory,
   getCounselors,
   getUpcomingConsultations,
   type ConsultationStatus,
   type StaffConsultationSummary,
} from '@/services/counseling.service';
import type { ServerStaffCounselingData } from '../getServerCounselingData';

function getApiErrorMessage(err: unknown, fallback: string) {
   return err instanceof ApiError ? err.message : fallback;
}

export type CounselorRoleFilter = 'ALL' | 'INSTRUCTOR' | 'MANAGER';
export type ConsultationStatusFilter = 'ALL' | ConsultationStatus;

export const UPCOMING_PAGE_SIZE = 3;
export const HISTORY_PAGE_SIZE = 5;

// 운영진 "상담 이력 조회" 탭
export function useStaffCounselingHistory(initial?: ServerStaffCounselingData) {
   const [upcoming, setUpcoming] = useState<StaffConsultationSummary[]>(initial?.initialUpcoming ?? []);
   const [isLoadingUpcoming, setIsLoadingUpcoming] = useState(!initial);
   const [hasUpcomingError, setHasUpcomingError] = useState(false);

   const [history, setHistory] = useState<StaffConsultationSummary[]>(() =>
      initial
         ? [...initial.initialHistory].sort(
              (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
           )
         : [],
   );
   const [isLoadingHistory, setIsLoadingHistory] = useState(!initial);
   const [hasHistoryError, setHasHistoryError] = useState(false);
   // 서버가 이미 초기 데이터를 넘겨줬으면, 마운트 시점의 첫 조회들은 건너뛴다
   const skipInitialUpcomingFetchRef = useRef(initial != null);
   const skipInitialHistoryFetchRef = useRef(initial != null);

   // useApplyCounseling과 같은 queryKey를 써서 캐시를 공유한다. 필터를 보조하는 정보일 뿐이라
   // 실패해도 조용히 무시한다(목록 자체는 그대로 보여준다)
   const { data: counselors = [] } = useQuery({
      queryKey: ['counselors'],
      queryFn: getCounselors,
      initialData: initial?.initialCounselors,
   });
   const roleByName = useMemo(
      () => new Map<string, UserRole>(counselors.map((counselor) => [counselor.name, counselor.role])),
      [counselors],
   );

   const [roleFilter, setRoleFilter] = useState<CounselorRoleFilter>('ALL');
   const [statusFilter, setStatusFilter] = useState<ConsultationStatusFilter>('ALL');

   const [upcomingPage, setUpcomingPage] = useState(1);
   const [historyPage, setHistoryPage] = useState(1);

   useEffect(() => {
      if (skipInitialUpcomingFetchRef.current) {
         skipInitialUpcomingFetchRef.current = false;
         return;
      }
      let isMounted = true;

      getUpcomingConsultations()
         .then((data) => {
            if (isMounted) setUpcoming(data);
         })
         .catch((err) => {
            if (!isMounted) return;
            setHasUpcomingError(true);
            toast.error(getApiErrorMessage(err, '다가오는 상담을 불러오지 못했습니다.'));
         })
         .finally(() => {
            if (isMounted) setIsLoadingUpcoming(false);
         });

      return () => {
         isMounted = false;
      };
   }, []);

   useEffect(() => {
      if (skipInitialHistoryFetchRef.current) {
         skipInitialHistoryFetchRef.current = false;
         return;
      }
      let isMounted = true;

      getConsultationHistory()
         .then((data) => {
            if (!isMounted) return;
            const sorted = [...data].sort(
               (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
            );
            setHistory(sorted);
         })
         .catch((err) => {
            if (!isMounted) return;
            setHasHistoryError(true);
            toast.error(getApiErrorMessage(err, '상담 이력을 불러오지 못했습니다.'));
         })
         .finally(() => {
            if (isMounted) setIsLoadingHistory(false);
         });

      return () => {
         isMounted = false;
      };
   }, []);

   const filteredHistory = useMemo(() => {
      return history.filter((item) => {
         if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
         if (roleFilter !== 'ALL' && roleByName.get(item.counselorName) !== roleFilter) {
            return false;
         }
         return true;
      });
   }, [history, statusFilter, roleFilter, roleByName]);

   const changeRoleFilter = (value: CounselorRoleFilter) => {
      setRoleFilter(value);
      setHistoryPage(1);
   };

   const changeStatusFilter = (value: ConsultationStatusFilter) => {
      setStatusFilter(value);
      setHistoryPage(1);
   };

   const upcomingTotalPages = Math.max(1, Math.ceil(upcoming.length / UPCOMING_PAGE_SIZE));
   const pagedUpcoming = upcoming.slice(
      (upcomingPage - 1) * UPCOMING_PAGE_SIZE,
      upcomingPage * UPCOMING_PAGE_SIZE,
   );

   const historyTotalPages = Math.max(1, Math.ceil(filteredHistory.length / HISTORY_PAGE_SIZE));
   const pagedHistory = filteredHistory.slice(
      (historyPage - 1) * HISTORY_PAGE_SIZE,
      historyPage * HISTORY_PAGE_SIZE,
   );

   return {
      upcoming,
      pagedUpcoming,
      upcomingPage,
      setUpcomingPage,
      upcomingTotalPages,
      isLoadingUpcoming,
      hasUpcomingError,
      history: filteredHistory,
      pagedHistory,
      historyPage,
      setHistoryPage,
      historyTotalPages,
      isLoadingHistory,
      hasHistoryError,
      roleFilter,
      setRoleFilter: changeRoleFilter,
      statusFilter,
      setStatusFilter: changeStatusFilter,
   };
}
