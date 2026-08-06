'use client';

import { Download, FileText } from 'lucide-react';
import { formatFileSize } from '@/lib/formatFileSize';
import type { NoticeAttachment } from '../../types';

type Props = {
   attachments: NoticeAttachment[];
};

// 상세 조회 페이지의 첨부파일 목록 - 파일명 옆에 용량을 같이 표시
export default function NoticeAttachmentList({ attachments }: Props) {
   if (attachments.length === 0) return null;

   return (
      <div>
         <div className="mx-8 border-t border-[#E5E7EB]" />

         <div className="px-8 py-6">
            <h3 className="text-sm font-semibold text-gray-900">첨부파일</h3>
            <div className="mt-3 flex flex-col gap-2">
               {attachments.map((attachment) => (
                  <div
                     key={attachment.name}
                     className="flex items-center justify-between gap-2 rounded-xs bg-[#F9FAFB]  border border-[#E5E7EB] px-4 py-2.5 text-sm"
                  >
                     <div className="flex min-w-0 items-center gap-2 text-gray-700">
                        <FileText size={16} className="shrink-0 text-gray-400" />
                        <span className="truncate">{attachment.name}</span>
                     </div>
                     <div className="flex shrink-0 items-center gap-3">
                        <span className="text-gray-400">
                           {formatFileSize(attachment.sizeBytes)}
                        </span>
                        <button
                           type="button"
                           // TODO: 백엔드 준비되면 실제 파일 다운로드 연동
                           aria-label={`${attachment.name} 다운로드`}
                           className="cursor-pointer rounded-xs p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                        >
                           <Download size={16} />
                        </button>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>
   );
}
