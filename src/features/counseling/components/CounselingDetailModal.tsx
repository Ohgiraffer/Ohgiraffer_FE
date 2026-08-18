'use client';

import { X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Modal from '@/components/ui/Modal';
import type { ConsultationDetail } from '@/services/counseling.service';
import CounselingStatusBadge from './CounselingStatusBadge';

type Props = {
   detail: ConsultationDetail;
   onClose: () => void;
};

// 훈련생 "내 상담 이력" 상세 모달
export default function CounselingDetailModal({ detail, onClose }: Props) {
   return (
      <Modal onClose={onClose} ariaLabel="상담 상세" panelClassName="w-full max-w-md">
         <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-3 text-lg font-bold break-keep text-gray-900">
               {detail.topic}
               <CounselingStatusBadge status={detail.status} />
            </h2>
            <button
               type="button"
               onClick={onClose}
               aria-label="닫기"
               className="cursor-pointer rounded-sm p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-700"
            >
               <X size={20} />
            </button>
         </div>
         <hr className='border-[#F3F4F6] mt-4'/>
         <div className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div>
               <p className="text-[13px] text-[#9CA3AF]">신청자</p>
               <p className="mt-1 text-[15px] text-gray-900">{detail.requesterName}</p>
            </div>
            <div>
               <p className="text-[13px] text-[#9CA3AF]">담당자</p>
               <p className="mt-1 text-[15px] text-gray-900">{detail.counselorName}</p>
            </div>
         </div>

         <div className="mt-4 text-sm">
            <p className="text-[13px] text-[#9CA3AF]">일시</p>
            <p className="mt-1 text-[15px] text-gray-900">
               {format(parseISO(detail.scheduledAt), 'yyyy-MM-dd HH:mm')}
            </p>
         </div>

         <div className="mt-5">
            <p className="text-sm font-semibold text-[#374151]">요청 내용</p>
            <p className="mt-2 rounded-xs bg-[#F9FAFB] p-3 text-sm whitespace-pre-line text-gray-700">
               {detail.content}
            </p>
         </div>
      </Modal>
   );
}
