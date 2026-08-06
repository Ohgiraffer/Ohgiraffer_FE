'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

const FOCUSABLE_SELECTOR =
   'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalProps {
   onClose: () => void;
   ariaLabel: string;
   panelClassName?: string;
   children: React.ReactNode;
   // 임시저장 없이 입력값이 날아갈 수 있는 등록/작성 폼은 false로 넘겨 오조작으로 인한 입력 유실을 막는다
   closeOnBackdropClick?: boolean;
}

// 모달 공통 접근성(Escape 닫기, 포커스 트랩/복원, role=dialog)을 한곳에서 처리한다.
// 실제 내용은 각 모달이 채운다.
export default function Modal({
   onClose,
   ariaLabel,
   panelClassName,
   children,
   closeOnBackdropClick = true,
}: ModalProps) {
   const panelRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      const previouslyFocused = document.activeElement as HTMLElement | null;
      const panel = panelRef.current;
      const firstFocusable = panel?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (firstFocusable ?? panel)?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
         if (e.key === 'Escape') {
            onClose();
            return;
         }
         if (e.key !== 'Tab' || !panel) return;

         const focusableEls = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
         if (focusableEls.length === 0) return;
         const first = focusableEls[0];
         const last = focusableEls[focusableEls.length - 1];

         if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
         } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
         }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
         document.removeEventListener('keydown', handleKeyDown);
         previouslyFocused?.focus();
      };
      // onClose가 리렌더마다 새로 생성돼도 최초 마운트 시점의 클로저로 충분히 동작한다 (setState 함수 자체는 항상 동일)
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   return (
      <div
         className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
         onClick={closeOnBackdropClick ? onClose : undefined}
      >
         <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            tabIndex={-1}
            className={cn('rounded-sm bg-white p-6 outline-none', panelClassName)}
            onClick={(e) => e.stopPropagation()}
         >
            {children}
         </div>
      </div>
   );
}
