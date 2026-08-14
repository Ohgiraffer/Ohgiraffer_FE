'use client';

import { Download, FileText } from 'lucide-react';
import { formatFileSize } from '@/lib/formatFileSize';
import type { NoticeAttachment } from '@/services/notice.service';

type Props = {
   attachments: NoticeAttachment[];
};

// 상세 조회 페이지 첨부파일 목록
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
                     key={attachment.noticeAttachmentId}
                     className="flex items-center justify-between gap-2 rounded-xs border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2.5 text-sm"
                  >
                     <div className="flex min-w-0 items-center gap-2 text-gray-700">
                        <FileText size={16} className="shrink-0 text-gray-400" />
                        <span className="truncate">{attachment.fileName}</span>
                     </div>
                     <div className="flex shrink-0 items-center gap-3">
                        <span className="text-gray-400">
                           {formatFileSize(attachment.fileSizeBytes)}
                        </span>
                        <a
                           href={attachment.downloadUrl}
                           download={attachment.fileName}
                           target="_blank"
                           rel="noopener noreferrer"
                           aria-label={`${attachment.fileName} 다운로드`}
                           className="cursor-pointer rounded-xs p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                        >
                           <Download size={16} />
                        </a>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>
   );
}
