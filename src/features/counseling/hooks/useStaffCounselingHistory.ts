'use client';

import { useEffect, useMemo, useState } from 'react';
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

function getApiErrorMessage(err: unknown, fallback: string) {
   return err instanceof ApiError ? err.message : fallback;
}

export type CounselorRoleFilter = 'ALL' | 'INSTRUCTOR' | 'MANAGER';
export type ConsultationStatusFilter = 'ALL' | ConsultationStatus;

export const UPCOMING_PAGE_SIZE = 3;
export const HISTORY_PAGE_SIZE = 5;

// 운영진 "상담 이력 조회" 탭 상태 - 위: 본인에게 예정된 "다가오는 상담"(API가 이미 오름차순으로
// 내려줌), 아래: 전체 운영진의 상담 이력을 담당자 역할·상태로 필터링해서 날짜 빠른 순으로 보여준다
export function useStaffCounselingHistory() {
   const [upcoming, setUpcoming] = useState<StaffConsultationSummary[]>([]);
   const [isLoadingUpcoming, setIsLoadingUpcoming] = useState(true);
   const [hasUpcomingError, setHasUpcomingError] = useState(false);

   const [history, setHistory] = useState<StaffConsultationSummary[]>([]);
   const [isLoadingHistory, setIsLoadingHistory] = useState(true);
   const [hasHistoryError, setHasHistoryError] = useState(false);

   // 상담 이력 응답엔 담당자의 역할이 없어서, "담당자" 필터(강사/매니저)는 상담 가능 운영진
   // 목록(이름 기준)에서 역할을 가져와 매칭한다. 상담 가능 시간을 한 번도 등록한 적 없는
   // 운영진은 이 목록에 없어 역할을 못 찾을 수 있는데, 이 경우 '전체'에서만 보인다
   const [roleByName, setRoleByName] = useState<Map<string, UserRole>>(new Map());

   const [roleFilter, setRoleFilter] = useState<CounselorRoleFilter>('ALL');
   const [statusFilter, setStatusFilter] = useState<ConsultationStatusFilter>('ALL');

   const [upcomingPage, setUpcomingPage] = useState(1);
   const [historyPage, setHistoryPage] = useState(1);

   useEffect(() => {
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

   useEffect(() => {
      let isMounted = true;

      getCounselors()
         .then((data) => {
            if (!isMounted) return;
            setRoleByName(new Map(data.map((counselor) => [counselor.name, counselor.role])));
         })
         .catch(() => {
            // 필터를 보조하는 정보일 뿐이라 실패해도 조용히 무시(목록 자체는 그대로 보여준다)
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

   // 필터가 바뀌면 목록 자체가 줄어들 수 있어, 이전 필터 기준 페이지에 그대로 머무르면 빈 페이지를
   // 보게 될 수 있다 - effect가 아니라 필터를 바꾸는 시점에 동기적으로 1페이지로 되돌린다
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
