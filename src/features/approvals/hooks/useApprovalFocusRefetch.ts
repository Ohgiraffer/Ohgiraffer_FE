'use client';

import { useEffect, useRef } from 'react';
import {
   getApprovalDetail,
   type ApprovalDetail,
   type ApprovalStatus,
} from '@/services/approval.service';

function isTerminalStatus(status: ApprovalStatus) {
   return status === 'APPROVED' || status === 'REJECTED' || status === 'COMPLETED';
}

// 결재 상세 페이지를 백그라운드 탭에 두고 있다가 다시 돌아왔을 때, 그 사이 매니저가 처리해서
// 바뀌었을 수 있는 최신 상태를 1회만 재조회한다. 반복 폴링은 하지 않는다 - "계속 열어두고
// 자동 갱신을 기다리는" 시나리오는 실제 사용 패턴과 맞지 않고 백엔드 부하만 키운다는 판단으로,
// "자리를 비웠다 돌아왔을 때 최신화"만 담당하도록 최소화했다
export function useApprovalFocusRefetch(
   approvalId: number,
   status: ApprovalStatus | undefined,
   enabled: boolean,
   onUpdate: (detail: ApprovalDetail) => void,
) {
   const onUpdateRef = useRef(onUpdate);
   useEffect(() => {
      onUpdateRef.current = onUpdate;
   });

   useEffect(() => {
      if (!enabled || status === undefined || isTerminalStatus(status)) return;

      let isFetching = false;

      const handleVisibilityChange = () => {
         if (document.visibilityState !== 'visible' || isFetching) return;

         isFetching = true;
         getApprovalDetail(approvalId)
            .then((data) => onUpdateRef.current(data))
            .catch(() => {
               // 조용한 재조회 실패 - 사용자가 직접 새로고침하면 되므로 별도 알림 없이 무시한다
            })
            .finally(() => {
               isFetching = false;
            });
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
         document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
   }, [approvalId, status, enabled]);
}
