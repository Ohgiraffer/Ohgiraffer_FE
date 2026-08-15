'use client';

import { useEffect, useRef, useState } from 'react';
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
   const [hasError, setHasError] = useState(false);
   const [refetchKey, setRefetchKey] = useState(0);
   // 한 번이라도 정상적으로 불러온 적이 있는지 - 확인/다운로드 처리 직후의 조용한 재조회(refetch)가
   // 실패했을 때 이미 보여주고 있던 정상 목록을 에러 화면으로 덮을지 토스트로만 알릴지 구분한다
   const hasLoadedOnceRef = useRef(false);

   useEffect(() => {
      let isMounted = true;

      getApprovals(scope)
         .then((data) => {
            if (!isMounted) return;
            setApprovals(data.approvals);
            setHasError(false);
            hasLoadedOnceRef.current = true;
         })
         .catch(() => {
            if (!isMounted) return;
            if (hasLoadedOnceRef.current) {
               toast.error('최신 결재 목록을 불러오지 못했습니다. 새로고침해주세요.');
            } else {
               setHasError(true);
            }
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
