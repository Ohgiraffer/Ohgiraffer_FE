'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import SearchInput from '@/components/ui/SearchInput';
import Pagination from '@/components/ui/Pagination';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/shadcn/select';
import { toast } from '@/lib/toast';
import { ApiError } from '@/lib/http';
import { useAuth } from '@/components/auth/AuthContext';
import {
   downloadSubmissionItem,
   getSubmissionBoxSubmissions,
   type SubmissionStatusFilter,
} from '@/services/submissionBox.service';
import StatusBadge from '../StatusBadge';
import ProgressBar from '../ProgressBar';
import { formatDateTime } from '../../formatSubmissionDate';
import SubmissionPreviewModal from './SubmissionPreviewModal';
import SubmissionValueCell from './SubmissionValueCell';
import StudentBoxDetailClient from './StudentBoxDetailClient';
import type { SubmissionBoxSubmissionsDetail, SubmissionItemValue } from '../../types';

const STATUS_OPTIONS: Array<{ value: SubmissionStatusFilter; label: string }> = [
   { value: 'ALL', label: '전체' },
   { value: 'SUBMITTED', label: '제출완료' },
   { value: 'NOT_SUBMITTED', label: '미제출' },
];

const PAGE_SIZE = 20;

interface BoxDetailClientProps {
   boxId: string;
}

export default function BoxDetailClient({ boxId }: BoxDetailClientProps) {
   const { role } = useAuth();
   const router = useRouter();
   const submissionBoxId = Number(boxId);

   const [detail, setDetail] = useState<SubmissionBoxSubmissionsDetail | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [hasError, setHasError] = useState(false);
   const [keyword, setKeyword] = useState('');
   const [statusFilter, setStatusFilter] = useState<SubmissionStatusFilter>('ALL');
   const [currentPage, setCurrentPage] = useState(1);
   const [previewTarget, setPreviewTarget] = useState<number | null>(null);
   const [retryKey, setRetryKey] = useState(0);

   useEffect(() => {
      if (!Number.isInteger(submissionBoxId) || role === 'STUDENT') return;
      let isMounted = true;
      getSubmissionBoxSubmissions(submissionBoxId, {
         keyword: keyword || undefined,
         status: statusFilter === 'ALL' ? undefined : statusFilter,
         page: currentPage - 1,
         size: PAGE_SIZE,
      })
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
            setHasError(true);
         })
         .finally(() => {
            if (isMounted) setIsLoading(false);
         });
      return () => {
         isMounted = false;
      };
   }, [submissionBoxId, keyword, statusFilter, currentPage, retryKey, router, role]);

   const retry = () => {
      setIsLoading(true);
      setHasError(false);
      setRetryKey((key) => key + 1);
   };

   const handleSearch = (value: string) => {
      setKeyword(value);
      setCurrentPage(1);
   };

   const handleStatusChange = (value: SubmissionStatusFilter) => {
      setStatusFilter(value);
      setCurrentPage(1);
   };

   const handleDownload = async (value: SubmissionItemValue) => {
      try {
         // 더 이상 302로 파일을 직접 안 내려주고, 매 클릭마다 새로 발급받은 임시 URL로만 이동한다.
         // presigned URL은 교차 출처라 a.download가 무시될 수 있어, blob으로 받아와야
         // originalFileName이 실제 저장 파일명으로 보장된다
         const { downloadUrl, originalFileName } = await downloadSubmissionItem(
            value.submissionItemValueId,
         );
         const res = await fetch(downloadUrl);
         if (!res.ok) throw new Error('파일 다운로드에 실패했습니다.');
         const blob = await res.blob();
         const objectUrl = URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = objectUrl;
         a.download = originalFileName ?? '다운로드';
         a.click();
         URL.revokeObjectURL(objectUrl);
      } catch (err) {
         toast.error(
            err instanceof ApiError
               ? err.message
               : '다운로드 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
         );
      }
   };

   if (role === 'STUDENT') return <StudentBoxDetailClient boxId={boxId} />;

   if (!Number.isInteger(submissionBoxId)) {
      return (
         <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
            <Link
               href="/submissions"
               className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
               <ChevronLeft size={16} />
               목록으로
            </Link>
            <p className="mt-10 text-center text-sm text-gray-400">제출함을 찾을 수 없습니다.</p>
         </div>
      );
   }

   return (
      <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
         <Link
            href="/submissions"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
         >
            <ChevronLeft size={16} />
            목록으로
         </Link>
         <h1 className="mt-3 text-2xl font-bold text-gray-900">제출 현황 상세</h1>

         {isLoading && !detail ? (
            <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>
         ) : hasError || !detail ? (
            <div className="flex flex-col items-center gap-3 py-16">
               <p className="text-sm text-gray-400">제출 현황을 불러오지 못했습니다.</p>
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
                        <p className="text-xs text-gray-400">시작일</p>
                        <p className="mt-1 text-sm font-medium text-gray-900">
                           {formatDateTime(detail.startAt)}
                        </p>
                        <p className="mt-2 text-xs text-gray-400">마감일</p>
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
                              className="rounded-xs border border-gray-200 px-3 py-1.5 bg-[#F9FAFB] text-xs text-gray-600"
                           >
                              {item.itemName} · {item.allowedFileTypes ?? '링크'}
                           </span>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="mt-6 rounded-sm border border-[#E5E7EB] bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-3 p-5">
                     <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-900">
                           {detail.submittedCount}/{detail.targetCount}{' '}
                           {detail.targetScope === 'TEAM' ? '팀' : '명'} 제출완료
                        </span>
                        <ProgressBar
                           value={detail.submittedCount}
                           max={detail.targetCount}
                           className="w-40"
                        />
                     </div>
                     <div className="flex flex-wrap items-center gap-2">
                        <SearchInput
                           onSearch={handleSearch}
                           placeholder={detail.targetScope === 'TEAM' ? '팀명 검색' : '이름 검색'}
                           className="w-full sm:w-64"
                        />
                        <Select
                           value={statusFilter}
                           onValueChange={(value) =>
                              value && handleStatusChange(value as SubmissionStatusFilter)
                           }
                        >
                           <SelectTrigger className="data-[size=default]:h-10 w-32 rounded-xs bg-white">
                              <SelectValue placeholder="전체">
                                 {(value: SubmissionStatusFilter | null) =>
                                    STATUS_OPTIONS.find((option) => option.value === value)
                                       ?.label ?? '전체'
                                 }
                              </SelectValue>
                           </SelectTrigger>
                           <SelectContent alignItemWithTrigger={false} align="start">
                              {STATUS_OPTIONS.map((option) => (
                                 <SelectItem
                                    key={option.value}
                                    value={option.value}
                                    className="cursor-pointer"
                                 >
                                    {option.label}
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>
                  </div>

                  {detail.submissions.length === 0 ? (
                     <p className="py-16 text-center text-sm text-gray-400">
                        {keyword || statusFilter !== 'ALL'
                           ? '검색 결과가 없습니다.'
                           : '표시할 제출 내역이 없습니다.'}
                     </p>
                  ) : (
                     <>
                        <table className="w-full table-fixed text-left text-sm">
                           <thead>
                              <tr className="border-y border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
                                 <th className="w-[16%] px-6 py-3 font-medium">
                                    {detail.targetScope === 'TEAM' ? '팀' : '이름'}
                                 </th>
                                 {detail.items.map((item) => (
                                    <th
                                       key={item.submissionBoxItemId}
                                       className="px-6 py-3 font-medium text-center"
                                    >
                                       {item.itemName}
                                    </th>
                                 ))}
                                 <th className="w-[10%] px-6 py-3 font-medium text-center">전체</th>
                                 <th className="w-[16%] px-6 py-3 font-medium text-center">제출 일시</th>
                              </tr>
                           </thead>
                           <tbody>
                              {detail.submissions.map((entry) => (
                                 <tr
                                    key={entry.targetId}
                                    className="border-b border-[#F3F4F6] last:border-b-0"
                                 >
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                       {entry.targetName}
                                       {detail.targetScope === 'INDIVIDUAL' && entry.targetEmail && (
                                          <p className="mt-0.5 text-xs font-normal text-gray-400">
                                             {entry.targetEmail}
                                          </p>
                                       )}
                                    </td>
                                    {detail.items.map((item) => {
                                       const value = entry.values.find(
                                          (v) => v.submissionBoxItemId === item.submissionBoxItemId,
                                       );
                                       return (
                                          <td key={item.submissionBoxItemId} className="px-6 py-4">
                                             <div className="flex justify-center">
                                                <SubmissionValueCell
                                                   value={value}
                                                   onPreview={setPreviewTarget}
                                                   onDownload={handleDownload}
                                                />
                                             </div>
                                          </td>
                                       );
                                    })}
                                    <td className="px-6 py-4">
                                       <div className="flex items-center justify-center gap-1">
                                          <StatusBadge tone={entry.submitted ? 'success' : 'danger'}>
                                             {entry.submitted ? '완료' : '미제출'}
                                          </StatusBadge>
                                          {entry.late && <StatusBadge tone="gold">지각</StatusBadge>}
                                       </div>
                                    </td>
                                    <td className="px-6 py-4 text-center text-gray-500">
                                       {formatDateTime(entry.submittedAt)}
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>

                        <div className="p-5">
                           <Pagination
                              currentPage={currentPage}
                              totalPages={detail.totalPages}
                              onPageChange={setCurrentPage}
                           />
                        </div>
                     </>
                  )}
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
