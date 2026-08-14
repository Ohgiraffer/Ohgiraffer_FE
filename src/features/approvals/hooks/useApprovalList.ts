'use client';

import { useEffect, useState } from 'react';
import {
   getApprovals,
   type ApprovalScope,
   type ApprovalSummary,
} from '@/services/approval.service';

// 결재 이력(REQUESTED)/결재 처리(PROCESSING) 탭이 공용으로 쓰는 목록 조회 훅
export function useApprovalList(scope: ApprovalScope) {
   const [approvals, setApprovals] = useState<ApprovalSummary[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [hasError, setHasError] = useState(false);
   const [refetchKey, setRefetchKey] = useState(0);

   useEffect(() => {
      let isMounted = true;

      getApprovals(scope)
         .then((data) => {
            if (!isMounted) return;
            setApprovals(data.approvals);
            
            setHasError(false);
         })
         .catch(() => {
            if (!isMounted) return;
            setHasError(true);
         })
         .finally(() => {
            if (isMounted) setIsLoading(false);
         });

      return () => {
         isMounted = false;
      };
   }, [scope, refetchKey]);

   const refetch = () => setRefetchKey((key) => key + 1);

   return { approvals, isLoading, hasError, refetch };
}
