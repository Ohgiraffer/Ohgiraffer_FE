'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';

type Props = {
   onClose: () => void;
   onSubmit: (reason: string) => void;
   isSubmitting?: boolean;
};

// ConfirmModal은 입력 필드를 지원하지 않아, 반려 사유를 필수로 받아야 하는 반려 처리는 별도 모달로 둔다
export default function RejectReasonModal({ onClose, onSubmit, isSubmitting = false }: Props) {
   const [reason, setReason] = useState('');

   return (
      <Modal
         onClose={onClose}
         ariaLabel="결재 반려"
         panelClassName="w-full max-w-md"
         closeOnBackdropClick={false}
      >
         <h2 className="text-lg font-bold text-gray-900">
            반려 사유 입력 <span className="font-bold text-[16px] text-brand-gold">*</span>
         </h2>
         <p className="mt-1 text-sm text-gray-500">반려 처리 후 신청인에게 사유가 전달됩니다.</p>

         <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="반려 사유를 입력해주세요"
            rows={4}
            className="mt-4 w-full resize-none rounded-xs border border-[#E5E7EB] px-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-green"
         />

         <div className="mt-5 flex gap-2">
            <button
               type="button"
               onClick={onClose}
               className="flex-1 cursor-pointer rounded-xs border border-[#E5E7EB] py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
               취소
            </button>
            <button
               type="button"
               disabled={!reason.trim() || isSubmitting}
               onClick={() => onSubmit(reason.trim())}
               className="flex-1 cursor-pointer rounded-xs bg-brand-maroon py-2.5 text-sm font-semibold text-white hover:bg-[#832E2E] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
            >
               반려
            </button>
         </div>
      </Modal>
   );
}
