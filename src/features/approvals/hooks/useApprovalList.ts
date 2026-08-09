'use client';

import { useEffect, useState } from 'react';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import {
   getApprovals,
   type ApprovalScope,
   type ApprovalSummary,
} from '@/services/approval.service';

// 결재 이력(REQUESTED)/결재 처리(PROCESSING) 탭이 공용으로 쓰는 목록 조회 훅
export function useApprovalList(scope: ApprovalScope) {
   const [approvals, setApprovals] = useState<ApprovalSummary[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [refetchKey, setRefetchKey] = useState(0);

   useEffect(() => {
      let isMounted = true;

      getApprovals(scope)
         .then((data) => {
            if (isMounted) setApprovals(data.approvals);
         })
         .catch((err) => {
            if (!isMounted) return;
            toast.error(
               err instanceof ApiError
                  ? err.message
                  : '결재 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
            );
         })
         .finally(() => {
            if (isMounted) setIsLoading(false);
         });

      return () => {
         isMounted = false;
      };
      // scope가 바뀌거나 refetch()가 호출되면(예: 확인 처리 후 목록 갱신) 다시 조회
   }, [scope, refetchKey]);

   // 목록을 다시 조회할 때도 기존 목록은 그대로 보여주다가 새 데이터로 갈아끼운다(깜빡임 방지 위해
   // isLoading은 건드리지 않음)
   const refetch = () => setRefetchKey((key) => key + 1);

   return { approvals, isLoading, refetch };
}
