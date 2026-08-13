'use client';

import { useEffect, useRef, useState } from 'react';
import { getApprovalDetail, type ApprovalDetail, type ApprovalStatus } from '@/services/approval.service';

const POLL_INTERVAL_MS = 5000;
// 5초 * 60 = 5분 - 발표 시연 중 설명이 길어져도 버틸 수 있는 여유. 상태가 바뀌면(대기→확인중)
// 리셋되어 다음 단계도 다시 5분을 새로 쓸 수 있다
const MAX_ATTEMPTS_PER_PHASE = 60;
// 연속으로 이만큼 조회에 실패하면(네트워크 문제 등) 그만둔다 - "아직 상태가 안 바뀜"은 실패가 아님
const MAX_CONSECUTIVE_FAILURES = 5;

function isTerminalStatus(status: ApprovalStatus) {
   return status === 'APPROVED' || status === 'REJECTED' || status === 'COMPLETED';
}

// 결재 신청자 본인이 이 상세 화면을 보고 있는 동안, 담당자가 확인/승인/반려하면 새로고침 없이
// 화면이 그대로 갱신되도록 짧은 간격으로 조용히 다시 조회한다.
// - 최종 상태(승인/반려/처리완료)가 되면 그 즉시 완전히 멈춘다
// - 단계가 바뀌면(대기→확인중) 시도 횟수를 리셋해서 다음 단계도 같은 여유를 다시 갖는다
// - 탭이 백그라운드면 요청 자체를 건너뛰고(시도 횟수도 안 늘림), 다시 보이면 곧바로 한 번 조회한다
// - 연속 5회 조회 실패하면 멈추고 안내한다
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
   // 최신 onUpdate를 항상 참조하기 위한 ref - effect의 의존성 배열에 onUpdate를 넣지 않아도 되게 함.
   // ref는 렌더링 중이 아니라 effect 안에서만 써야 해서 별도 effect로 분리해 매 렌더 후 갱신한다
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
      // 느린 네트워크에서 이전 요청이 5초 안에 안 끝나면 다음 interval이 겹쳐서 나갈 수 있다 -
      // 응답이 역전되면(늦게 보낸 요청이 먼저 도착) 오래된 상태가 최신 상태를 덮어쓰므로 막는다
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

      // 발표 중 다른 창(매니저 화면)을 보다가 이 탭으로 돌아오는 순간, 다음 5초 간격을 기다리지
      // 않고 바로 한 번 조회해서 "돌아오자마자 바뀌어있다"는 느낌을 준다
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
