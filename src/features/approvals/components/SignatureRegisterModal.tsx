'use client';

import { X } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import SignatureUpload from './SignatureUpload';

type Props = {
   onClose: () => void;
};

// 매니저(결재 확인자)가 PDF에 들어갈 자신의 전자서명을 등록/조회/삭제하는 모달
export default function SignatureRegisterModal({ onClose }: Props) {
   return (
      <Modal onClose={onClose} ariaLabel="전자 서명 등록" panelClassName="w-full max-w-lg">
         <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">전자 서명 등록</h2>
            <button
               type="button"
               onClick={onClose}
               aria-label="닫기"
               className="cursor-pointer rounded-sm p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-700"
            >
               <X size={20} />
            </button>
         </div>
         <hr className="mt-4 border-[#F3F4F6]" />
         <div className="mt-4">
            <SignatureUpload />
         </div>
      </Modal>
   );
}
