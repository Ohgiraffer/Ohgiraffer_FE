'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

type ConfirmModalProps = {
   open: boolean;
   title: string;
   description?: string;
   confirmLabel?: string;
   cancelLabel?: string;
   onConfirm: () => void;
   onClose: () => void;
   // 'danger'는 삭제처럼 되돌릴 수 없는 작업용 - 확인 버튼이 brand-maroon으로 표시됨
   variant?: 'default' | 'danger';
};

// 페이지 전반에서 사용자 재확인이 필요한 모든 곳(등록/삭제 등)에서 재사용하는 전역 confirm 모달
export default function ConfirmModal({
   open,
   title,
   description,
   confirmLabel = '확인',
   cancelLabel = '취소',
   onConfirm,
   onClose,
   variant = 'default',
}: ConfirmModalProps) {
   useEffect(() => {
      if (!open) return;

      const handleKeyDown = (event: KeyboardEvent) => {
         if (event.key === 'Escape') onClose();
      };

      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      return () => {
         document.removeEventListener('keydown', handleKeyDown);
         document.body.style.overflow = '';
      };
   }, [open, onClose]);

   if (!open) return null;

   return createPortal(
      <div
         className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
         onClick={onClose}
      >
         <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-sm rounded-sm bg-white px-8 py-11 text-center shadow-lg"
         >
            <h2 id="confirm-modal-title" className="text-[18px] font-bold break-keep text-gray-900">
               {title}
            </h2>
            {description && <p className="mt-2 text-sm break-keep text-gray-500">{description}</p>}

            <div className="mt-6 flex gap-2">
               <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 cursor-pointer rounded-xs border border-[#E5E7EB] py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
               >
                  {cancelLabel}
               </button>
               <button
                  type="button"
                  onClick={onConfirm}
                  className={`flex-1 cursor-pointer rounded-xs py-2.5 text-sm font-semibold text-white ${
                     variant === 'danger'
                        ? 'bg-brand-maroon hover:bg-[#832E2E]'
                        : 'bg-brand-green hover:bg-[#4D655A]'
                  }`}
               >
                  {confirmLabel}
               </button>
            </div>
         </div>
      </div>,
      document.body,
   );
}
