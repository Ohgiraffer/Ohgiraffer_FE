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
   closeOnBackdropClick?: boolean;
}

export default function Modal({
   onClose,
   ariaLabel,
   panelClassName,
   children,
   closeOnBackdropClick = true,
}: ModalProps) {
   const panelRef = useRef<HTMLDivElement>(null);
   const onCloseRef = useRef(onClose);
   useEffect(() => {
      onCloseRef.current = onClose;
   });

   useEffect(() => {
      const previouslyFocused = document.activeElement as HTMLElement | null;
      const panel = panelRef.current;
      const firstFocusable = panel?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (firstFocusable ?? panel)?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
         if (e.key === 'Escape') {
            onCloseRef.current();
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
