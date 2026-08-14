'use client';

import { useEffect, useRef, useState } from 'react';
import { getApprovalDetail, type ApprovalDetail, type ApprovalStatus } from '@/services/approval.service';

const POLL_INTERVAL_MS = 5000;   // 5초 * 60 = 5분
const MAX_ATTEMPTS_PER_PHASE = 60;
const MAX_CONSECUTIVE_FAILURES = 5;

function isTerminalStatus(status: ApprovalStatus) {
   return status === 'APPROVED' || status === 'REJECTED' || status === 'COMPLETED';
}

export function useApprovalLivePolling(
   approvalId: number,
   status: ApprovalStatus | undefined,
   enabled: boolean,
   onUpdate: (detail: ApprovalDetail) => void,
) {
   const [isPollingStopped, setIsPollingStopped] = useState(false);
   const attemptsInPhaseRef = useRef(0);
   const consecutiveFailuresRef = useRef(0);
   const lastStatusRef = useRef(status);
   const onUpdateRef = useRef(onUpdate);
   useEffect(() => {
      onUpdateRef.current = onUpdate;
   }, [onUpdate]);

   useEffect(() => {
      if (!enabled || status === undefined || isTerminalStatus(status)) return;

      if (lastStatusRef.current !== status) {
         lastStatusRef.current = status;
         attemptsInPhaseRef.current = 0;
      }

      let isActive = true;
      
      let isFetching = false;

      const pollOnce = async () => {
         if (!isActive || isFetching || document.visibilityState !== 'visible') return;

         attemptsInPhaseRef.current += 1;
         if (attemptsInPhaseRef.current > MAX_ATTEMPTS_PER_PHASE) {
            stop();
            return;
         }

         isFetching = true;
         try {
            const data = await getApprovalDetail(approvalId);
            if (!isActive) return;
            consecutiveFailuresRef.current = 0;
            onUpdateRef.current(data);
         } catch {
            if (!isActive) return;
            consecutiveFailuresRef.current += 1;
            if (consecutiveFailuresRef.current >= MAX_CONSECUTIVE_FAILURES) {
               stop();
            }
         } finally {
            isFetching = false;
         }
      };

      const timer = setInterval(pollOnce, POLL_INTERVAL_MS);

      function stop() {
         isActive = false;
         clearInterval(timer);
         setIsPollingStopped(true);
      }

      const handleVisibilityChange = () => {
         if (document.visibilityState === 'visible') pollOnce();
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
         isActive = false;
         clearInterval(timer);
         document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
   }, [approvalId, status, enabled]);

   return { isPollingStopped };
}
