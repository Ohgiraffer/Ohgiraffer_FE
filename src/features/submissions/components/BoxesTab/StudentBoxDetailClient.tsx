'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Download, ExternalLink, Eye, Pencil, TriangleAlert, Upload } from 'lucide-react';
import { toast } from '@/lib/toast';
import { ApiError } from '@/lib/http';
import {
   downloadSubmissionItem,
   getSubmissionBoxDetailForStudent,
} from '@/services/submissionBox.service';
import StatusBadge from '../StatusBadge';
import { formatDateTime } from '../../formatSubmissionDate';
import SubmissionPreviewModal from './SubmissionPreviewModal';
import type { SubmissionBoxDetailForStudent, SubmissionItemValue } from '../../types';

const PREVIEWABLE_CONTENT_TYPES = new Set([
   'application/pdf',
   'video/mp4',
   'video/quicktime',
   'image/jpeg',
   'image/png',
   'image/webp',
   'image/gif',
]);

interface StudentBoxDetailClientProps {
   boxId: string;
}

export default function StudentBoxDetailClient({ boxId }: StudentBoxDetailClientProps) {
   const router = useRouter();
   const submissionBoxId = Number(boxId);

   const [detail, setDetail] = useState<SubmissionBoxDetailForStudent | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [hasError, setHasError] = useState(false);
   const [retryKey, setRetryKey] = useState(0);
   const [previewTarget, setPreviewTarget] = useState<number | null>(null);

   useEffect(() => {
      if (!Number.isInteger(submissionBoxId)) return;
      let isMounted = true;
      getSubmissionBoxDetailForStudent(submissionBoxId)
         .then((result) => {
            if (isMounted) setDetail(result);
         })
         .catch((err) => {
            if (!isMounted) return;
            if (err instanceof ApiError && err.code === 'SUBMISSION_001') {
               toast.error(err.message);
               router.replace('/submissions');
               return;
            }
            if (err instanceof ApiError && err.code === 'SUBMISSION_011') {
               toast.error('소속된 팀이 없어 접근할 수 없습니다.');
            }
            setHasError(true);
         })
         .finally(() => {
            if (isMounted) setIsLoading(false);
         });
      return () => {
         isMounted = false;
      };
   }, [submissionBoxId, retryKey, router]);

   const retry = () => {
      setIsLoading(true);
      setHasError(false);
      setRetryKey((key) => key + 1);
   };

   const handleDownload = async (value: SubmissionItemValue) => {
      try {
         const { blob } = await downloadSubmissionItem(value.submissionItemValueId);
         const url = URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = value.originalFileName ?? '다운로드';
         a.click();
         URL.revokeObjectURL(url);
      } catch (err) {
         toast.error(
            err instanceof ApiError
               ? err.message
               : '다운로드 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
         );
      }
   };

   if (!Number.isInteger(submissionBoxId)) {
      return (
         <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
            <Link href="/submissions" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
               <ChevronLeft size={16} />
               목록으로
            </Link>
            <p className="mt-10 text-center text-sm text-gray-400">제출함을 찾을 수 없습니다.</p>
         </div>
      );
   }

   return (
      <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
         <Link href="/submissions" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ChevronLeft size={16} />
            목록으로
         </Link>
         <h1 className="mt-3 text-2xl font-bold text-gray-900">제출함 상세</h1>

         {isLoading && !detail ? (
            <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>
         ) : hasError || !detail ? (
            <div className="flex flex-col items-center gap-3 py-16">
               <p className="text-sm text-gray-400">제출함 정보를 불러오지 못했습니다.</p>
               <button
                  type="button"
                  onClick={retry}
                  className="cursor-pointer rounded-xs border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
               >
                  다시 시도
               </button>
            </div>
         ) : (
            <>
               <div className="mt-5 rounded-sm border border-[#E5E7EB] bg-white p-6">
                  <div className="flex items-start justify-between">
                     <div>
                        <h2 className="text-lg font-bold text-gray-900">{detail.projectName}</h2>
                        <div className="mt-2 flex items-center gap-2">
                           <StatusBadge tone="neutral">
                              {detail.targetScope === 'TEAM' ? '팀 제출' : '개인 제출'}
                           </StatusBadge>
                           <StatusBadge tone={detail.latePolicy === 'BLOCK' ? 'danger' : 'neutral'}>
                              {detail.latePolicy === 'BLOCK' ? '지각 차단' : '지각 허용'}
                           </StatusBadge>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-xs text-gray-400">마감일</p>
                        <p className="mt-1 text-sm font-medium text-gray-900">
                           {formatDateTime(detail.dueAt)}
                        </p>
                     </div>
                  </div>

                  <div className="mt-5">
                     <p className="text-sm text-gray-700">제출 항목</p>
                     <div className="mt-2 flex flex-wrap gap-2">
                        {detail.items.map((item) => (
                           <span
                              key={item.submissionBoxItemId}
                              className="rounded-xs border border-gray-200 px-3 py-1.5 text-xs text-gray-600"
                           >
                              {item.itemName} · {item.allowedFileTypes ?? '링크'}
                           </span>
                        ))}
                     </div>
                  </div>

                  {!detail.acceptingSubmissions && (
                     <div className="mt-4 flex items-start gap-2 rounded-xs bg-[#F5DFDC] px-3 py-2.5 text-xs text-brand-maroon">
                        <TriangleAlert size={14} className="mt-0.5 shrink-0" />
                        마감되어 더 이상 제출/수정할 수 없습니다
                     </div>
                  )}
                  {detail.acceptingSubmissions && detail.lateSubmission && (
                     <div className="mt-4 flex items-start gap-2 rounded-xs bg-[#F5DFDC] px-3 py-2.5 text-xs text-brand-maroon">
                        <TriangleAlert size={14} className="mt-0.5 shrink-0" />
                        지금 제출/수정하면 지각으로 기록됩니다
                     </div>
                  )}

                  {(detail.canSubmit || detail.canEdit) && (
                     <Link
                        href={`/submissions/boxes/${detail.submissionBoxId}/submit`}
                        className="mt-4 flex w-fit cursor-pointer items-center gap-1.5 rounded-sm bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-[#4D655A]"
                     >
                        {detail.canEdit ? <Pencil size={14} /> : <Upload size={14} />}
                        {detail.canEdit ? '내 제출물 수정' : '제출하기'}
                     </Link>
                  )}
               </div>

               <div className="mt-6 overflow-hidden rounded-sm border border-[#E5E7EB] bg-white">
                  <div className="p-5 text-sm font-bold text-gray-900">
                     {detail.submittedCount}
                     {detail.targetCount !== null ? `/${detail.targetCount}` : ''}{' '}
                     {detail.targetScope === 'TEAM' ? '팀' : '명'} 제출완료
                  </div>

                  <table className="w-full table-fixed text-left text-sm">
                     <thead>
                        <tr className="border-y border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
                           <th className="w-[14%] px-6 py-3 font-medium">
                              {detail.targetScope === 'TEAM' ? '팀' : '이름'}
                           </th>
                           {detail.items.map((item) => (
                              <th key={item.submissionBoxItemId} className="px-6 py-3 font-medium">
                                 {item.itemName}
                              </th>
                           ))}
                           <th className="w-[10%] px-6 py-3 font-medium">전체</th>
                           <th className="w-[16%] px-6 py-3 font-medium">제출 일시</th>
                        </tr>
                     </thead>
                     <tbody>
                        {detail.submissions.map((entry) => (
                           <tr
                              key={entry.targetId}
                              className={`border-b border-[#F3F4F6] last:border-b-0 ${
                                 entry.mine ? 'bg-[#F0F4F2]' : ''
                              }`}
                           >
                              <td className="px-6 py-4 font-medium text-gray-900">
                                 {entry.targetName}
                                 {entry.mine && (
                                    <span className="ml-1.5 text-xs font-normal text-brand-green">(나)</span>
                                 )}
                              </td>
                              {detail.items.map((item) => {
                                 const value = entry.values.find(
                                    (v) => v.submissionBoxItemId === item.submissionBoxItemId,
                                 );
                                 return (
                                    <td key={item.submissionBoxItemId} className="px-6 py-4">
                                       {!value ? (
                                          <span className="text-gray-300">—</span>
                                       ) : value.itemType === 'FILE' ? (
                                          <div className="flex items-center gap-1">
                                             {value.contentType &&
                                             PREVIEWABLE_CONTENT_TYPES.has(value.contentType) ? (
                                                <button
                                                   type="button"
                                                   onClick={() =>
                                                      setPreviewTarget(value.submissionItemValueId)
                                                   }
                                                   className="flex min-w-0 flex-1 cursor-pointer items-center gap-1 rounded-xs border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                                                >
                                                   <Eye size={12} className="shrink-0" />
                                                   <span className="truncate">
                                                      {value.originalFileName}
                                                   </span>
                                                </button>
                                             ) : (
                                                <span className="min-w-0 flex-1 truncate text-xs text-gray-700">
                                                   {value.originalFileName}
                                                </span>
                                             )}
                                             <button
                                                type="button"
                                                onClick={() => handleDownload(value)}
                                                aria-label="다운로드"
                                                className="shrink-0 cursor-pointer rounded-xs p-1.5 text-gray-400 hover:bg-gray-100"
                                             >
                                                <Download size={14} />
                                             </button>
                                          </div>
                                       ) : (
                                          <button
                                             type="button"
                                             onClick={() =>
                                                value.externalUrl &&
                                                window.open(value.externalUrl, '_blank', 'noopener,noreferrer')
                                             }
                                             className="flex cursor-pointer items-center gap-1 rounded-xs border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                                          >
                                             <ExternalLink size={12} />
                                             링크 확인
                                          </button>
                                       )}
                                    </td>
                                 );
                              })}
                              <td className="px-6 py-4">
                                 <div className="flex items-center gap-1">
                                    <StatusBadge tone={entry.submitted ? 'success' : 'danger'}>
                                       {entry.submitted ? '완료' : '미제출'}
                                    </StatusBadge>
                                    {entry.late && <StatusBadge tone="gold">지각</StatusBadge>}
                                 </div>
                              </td>
                              <td className="px-6 py-4 text-gray-500">
                                 {formatDateTime(entry.submittedAt)}
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </>
         )}

         {previewTarget !== null && (
            <SubmissionPreviewModal
               submissionItemValueId={previewTarget}
               onClose={() => setPreviewTarget(null)}
            />
         )}
      </div>
   );
}
