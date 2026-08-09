'use client';

import { Download, ExternalLink, Eye } from 'lucide-react';
import type { SubmissionItemValue } from '../../types';

// 운영진(BoxDetailClient)과 훈련생(StudentBoxDetailClient) 상세 테이블이 공유하는 값 셀 -
// 미리보기 가능 파일은 눈 아이콘, 그 외 파일/링크는 각각 다운로드/새 창 열기로 렌더링한다
const PREVIEWABLE_CONTENT_TYPES = new Set([
   'application/pdf',
   'video/mp4',
   'video/quicktime',
   'image/jpeg',
   'image/png',
   'image/webp',
   'image/gif',
]);

interface SubmissionValueCellProps {
   value: SubmissionItemValue | undefined;
   onPreview: (submissionItemValueId: number) => void;
   onDownload: (value: SubmissionItemValue) => void;
}

export default function SubmissionValueCell({
   value,
   onPreview,
   onDownload,
}: SubmissionValueCellProps) {
   if (!value) return <span className="text-gray-300">—</span>;

   if (value.itemType === 'FILE') {
      return (
         <div className="flex items-center gap-1">
            {value.contentType && PREVIEWABLE_CONTENT_TYPES.has(value.contentType) ? (
               <button
                  type="button"
                  onClick={() => onPreview(value.submissionItemValueId)}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-1 rounded-xs border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
               >
                  <Eye size={12} className="shrink-0" />
                  <span className="truncate">{value.originalFileName}</span>
               </button>
            ) : (
               <span className="min-w-0 flex-1 truncate text-xs text-gray-700">
                  {value.originalFileName}
               </span>
            )}
            <button
               type="button"
               onClick={() => onDownload(value)}
               aria-label="다운로드"
               className="shrink-0 cursor-pointer rounded-xs p-1.5 text-gray-400 hover:bg-gray-100"
            >
               <Download size={14} />
            </button>
         </div>
      );
   }

   if (!value.externalUrl) {
      return <span className="text-gray-300">—</span>;
   }

   return (
      <button
         type="button"
         onClick={() => window.open(value.externalUrl!, '_blank', 'noopener,noreferrer')}
         className="flex cursor-pointer items-center gap-1 rounded-xs border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
      >
         <ExternalLink size={12} />
         링크 확인
      </button>
   );
}
