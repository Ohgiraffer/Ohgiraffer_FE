'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { setUnsavedChangesChecker } from '@/lib/navigationGuard';

// 저장 안 한 변경사항이 있는 채로 화면을 떠나려는 시도(사이드바 이동, 새로고침/탭 닫기, 브라우저
// 뒤로가기, 로컬 취소 버튼 등)를 공통으로 가드한다. isDirty가 아니면 바로 실행하고, dirty면 실행을
// 보류해뒀다가 확인 모달에서 승인해야 실행한다(BoxCreateForm/ManagerTeamBoard가 각자 갖고 있던
// 동일한 로직을 추출)
export function useLeaveGuard(isDirty: boolean) {
   // 사이드바 등 앱 내 이동은 navigationGuard로, 새로고침/탭 닫기는 beforeunload로 막는다
   useEffect(() => {
      setUnsavedChangesChecker(() => isDirty);
      return () => setUnsavedChangesChecker(null);
   }, [isDirty]);

   useEffect(() => {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
         if (!isDirty) return;
         e.preventDefault();
         e.returnValue = '';
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
   }, [isDirty]);

   const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);
   const pendingActionRef = useRef<(() => void) | null>(null);

   const guardedAction = useCallback(
      (fn: () => void) => {
         if (!isDirty) {
            fn();
            return;
         }
         pendingActionRef.current = fn;
         setIsLeaveConfirmOpen(true);
      },
      [isDirty],
   );

   const onConfirmLeave = useCallback(() => {
      setIsLeaveConfirmOpen(false);
      const fn = pendingActionRef.current;
      pendingActionRef.current = null;
      fn?.();
   }, []);

   const onCancelLeave = useCallback(() => {
      setIsLeaveConfirmOpen(false);
      pendingActionRef.current = null;
   }, []);

   // 브라우저 뒤로가기 대응: dirty 상태로 들어가는 시점에 같은 주소로 더미 히스토리를 하나 쌓아둔다.
   // 뒤로가기를 누르면 popstate가 뜨는데, 그때 다시 더미를 쌓아 실제 이동을 취소하고 확인을 받는다.
   // state에 표식을 남겨두는 이유는, dirty↔clean을 왔다갔다 할 때마다(예: 수정 후 되돌리기) 더미를
   // 계속 쌓아두지 않고 - clean이 되는 시점에 지금 이 더미 위에 그대로 있으면 조용히 제거하기 위해서다.
   // 안 그러면 나중에 실제로 나갈 때 뒤로가기를 여러 번 눌러야 하는 문제가 생긴다
   const guardPushedRef = useRef(false);
   // 승인 후 go(-2)가 발생시키는 popstate까지 다시 가로채면 뒤로가기가 영원히 막히므로,
   // 승인된 이동 한 번은 그대로 통과시키기 위한 플래그
   const isLeavingRef = useRef(false);

   useEffect(() => {
      if (isDirty && !guardPushedRef.current) {
         window.history.pushState({ leaveGuard: true }, '', window.location.href);
         guardPushedRef.current = true;
      } else if (!isDirty && guardPushedRef.current) {
         guardPushedRef.current = false;
         const state = window.history.state as { leaveGuard?: boolean } | null;
         if (state?.leaveGuard) window.history.back();
      }
   }, [isDirty]);

   // 컴포넌트가 dirty인 채로(더미를 쌓아둔 채로) 그대로 언마운트되는 경우에도 더미를 정리한다
   useEffect(() => {
      return () => {
         if (!guardPushedRef.current) return;
         const state = window.history.state as { leaveGuard?: boolean } | null;
         if (state?.leaveGuard) window.history.back();
      };
   }, []);

   useEffect(() => {
      const handlePopState = () => {
         if (isLeavingRef.current) return;
         if (!isDirty) return;
         window.history.pushState({ leaveGuard: true }, '', window.location.href);
         guardedAction(() => {
            isLeavingRef.current = true;
            guardPushedRef.current = false;
            window.history.go(-2);
         });
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [isDirty]);

   return { guardedAction, isLeaveConfirmOpen, onConfirmLeave, onCancelLeave };
}
