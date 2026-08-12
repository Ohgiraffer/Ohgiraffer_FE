'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

type ConfirmModalProps = {
   open: boolean;
   title: string;
   description?: string;
   // description 아래, 버튼 행 위에 끼워 넣을 추가 내용(예: 체크박스) - 없으면 기존과 동일
   children?: React.ReactNode;
   confirmLabel?: string;
   cancelLabel?: string;
   onConfirm: () => void;
   onClose: () => void;
   // 'danger'는 삭제처럼 되돌릴 수 없는 작업용 - 확인 버튼이 brand-maroon으로 표시됨
   variant?: 'default' | 'danger';
   // 요청 처리 중일 때 true로 넘기면 확인/취소 버튼과 배경 클릭·Esc 닫기를 잠근다
   busy?: boolean;
};

// 페이지 전반에서 사용자 재확인이 필요한 모든 곳(등록/삭제 등)에서 재사용하는 전역 confirm 모달
export default function ConfirmModal({
   open,
   title,
   description,
   children,
   confirmLabel = '확인',
   cancelLabel = '취소',
   onConfirm,
   onClose,
   variant = 'default',
   busy = false,
}: ConfirmModalProps) {
   useEffect(() => {
      if (!open) return;

      const handleKeyDown = (event: KeyboardEvent) => {
         if (event.key === 'Escape' && !busy) onClose();
      };

      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      return () => {
         document.removeEventListener('keydown', handleKeyDown);
         document.body.style.overflow = '';
      };
   }, [open, onClose, busy]);

   if (!open) return null;

   return createPortal(
      <div
         // 우측 슬라이드 패널(SidePanelShell, z-60) 위에서도 뜰 수 있어(예: 공간관리 패널의 삭제 확인) 그보다 높게 둔다
         className="fixed inset-0 z-70 flex items-center justify-center bg-black/40 px-4"
         onClick={busy ? undefined : onClose}
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
            {description && (
               <p className="mt-2 text-sm break-keep whitespace-pre-line text-gray-500">
                  {description}
               </p>
            )}

            {children}

            <div className="mt-6 flex gap-2">
               <button
                  type="button"
                  onClick={onClose}
                  disabled={busy}
                  className="flex-1 cursor-pointer rounded-xs border border-[#E5E7EB] py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
               >
                  {cancelLabel}
               </button>
               <button
                  type="button"
                  onClick={onConfirm}
                  disabled={busy}
                  className={`flex-1 cursor-pointer rounded-xs py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${
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
