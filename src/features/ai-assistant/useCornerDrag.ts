'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

const STORAGE_KEY = 'campflow-ai-assistant-corner';
// 클릭과 드래그를 구분하는 최소 이동 거리(px) - 이보다 적게 움직였으면 클릭으로 간주한다
const DRAG_THRESHOLD = 6;

function isCorner(value: string | null): value is Corner {
   return (
      value === 'top-left' ||
      value === 'top-right' ||
      value === 'bottom-left' ||
      value === 'bottom-right'
   );
}

function readStoredCorner(): Corner {
   if (typeof window === 'undefined') return 'bottom-right';
   const stored = window.localStorage.getItem(STORAGE_KEY);
   return isCorner(stored) ? stored : 'bottom-right';
}

function getNearestCorner(x: number, y: number): Corner {
   const isLeft = x < window.innerWidth / 2;
   const isTop = y < window.innerHeight / 2;
   return `${isTop ? 'top' : 'bottom'}-${isLeft ? 'left' : 'right'}` as Corner;
}

interface UseCornerDragOptions {
   // 드래그가 시작되는 순간 호출 - 열려 있던 패널을 닫는 용도로 쓴다
   onDragStart?: () => void;
}

// 화면 네 모서리 중 하나에 붙어있는 플로팅 버튼을 드래그해서 다른 모서리로 스냅시키는 훅.
// 위치는 로컬스토리지에 저장해 다음 방문 때도 유지된다
export function useCornerDrag({ onDragStart }: UseCornerDragOptions = {}) {
   const [corner, setCorner] = useState<Corner>('bottom-right');
   const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
   const isDraggingRef = useRef(false);
   const startRef = useRef({ x: 0, y: 0 });
   const sizeRef = useRef({ width: 56, height: 56 });
   // 드래그 중 등록한 document 리스너 - 컴포넌트가 드래그 도중 언마운트돼도
   // effect cleanup에서 항상 제거할 수 있도록 보관해둔다
   const activeListenersRef = useRef<{
      move: (e: PointerEvent) => void;
      up: (e: PointerEvent) => void;
      cancel: (e: PointerEvent) => void;
   } | null>(null);

   useEffect(() => {
      // 로컬스토리지는 서버에서 알 수 없으므로 SSR/최초 렌더는 기본값으로 맞추고,
      // 마운트 후에만 저장된 값으로 갈아끼워 하이드레이션 불일치를 피한다
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCorner(readStoredCorner());
   }, []);

   useEffect(() => {
      return () => {
         const listeners = activeListenersRef.current;
         if (!listeners) return;
         document.removeEventListener('pointermove', listeners.move);
         document.removeEventListener('pointerup', listeners.up);
         document.removeEventListener('pointercancel', listeners.cancel);
      };
   }, []);

   const handlePointerDown = useCallback(
      (e: React.PointerEvent<HTMLButtonElement>) => {
         if (e.button !== 0 && e.pointerType === 'mouse') return;
         const rect = e.currentTarget.getBoundingClientRect();
         sizeRef.current = { width: rect.width, height: rect.height };
         startRef.current = { x: e.clientX, y: e.clientY };
         isDraggingRef.current = false;

         const cleanupListeners = () => {
            document.removeEventListener('pointermove', handlePointerMove);
            document.removeEventListener('pointerup', handlePointerUp);
            document.removeEventListener('pointercancel', handlePointerCancel);
            activeListenersRef.current = null;
         };

         const handlePointerMove = (moveEvent: PointerEvent) => {
            const dx = moveEvent.clientX - startRef.current.x;
            const dy = moveEvent.clientY - startRef.current.y;
            if (!isDraggingRef.current && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
               isDraggingRef.current = true;
               onDragStart?.();
            }
            if (isDraggingRef.current) {
               const { width, height } = sizeRef.current;
               const x = Math.min(Math.max(moveEvent.clientX - width / 2, 0), window.innerWidth - width);
               const y = Math.min(
                  Math.max(moveEvent.clientY - height / 2, 0),
                  window.innerHeight - height,
               );
               setDragPosition({ x, y });
            }
         };

         const handlePointerUp = (upEvent: PointerEvent) => {
            cleanupListeners();
            if (isDraggingRef.current) {
               const nextCorner = getNearestCorner(upEvent.clientX, upEvent.clientY);
               setCorner(nextCorner);
               window.localStorage.setItem(STORAGE_KEY, nextCorner);
            }
            setDragPosition(null);
         };

         // 브라우저가 드래그를 중간에 취소하면(pointercancel) 새 모서리로 확정하지 않고 원래 자리로 되돌린다
         const handlePointerCancel = () => {
            cleanupListeners();
            setDragPosition(null);
         };

         activeListenersRef.current = {
            move: handlePointerMove,
            up: handlePointerUp,
            cancel: handlePointerCancel,
         };
         document.addEventListener('pointermove', handlePointerMove);
         document.addEventListener('pointerup', handlePointerUp);
         document.addEventListener('pointercancel', handlePointerCancel);
      },
      [onDragStart],
   );

   // 드래그 직후 발생하는 click 이벤트에서 패널 토글을 막기 위해 호출부(onClick)가 확인한다
   const wasDragged = useCallback(() => isDraggingRef.current, []);

   return { corner, dragPosition, handlePointerDown, wasDragged };
}
