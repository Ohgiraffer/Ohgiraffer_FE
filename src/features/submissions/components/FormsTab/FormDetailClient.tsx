'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Download, ExternalLink } from 'lucide-react';
import SearchInput from '@/components/ui/SearchInput';
import Pagination from '@/components/ui/Pagination';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/shadcn/select';
import ChatAvatar from '@/features/chat/components/ChatAvatar';
import { toast } from '@/lib/toast';
import { ApiError } from '@/lib/http';
import { useAuth } from '@/components/auth/AuthContext';
import {
   downloadSurveySummaryPdf,
   getSurveyFormDetail,
   getSurveyFormResponses,
   type SurveyResponseStatusFilter,
} from '@/services/surveyForm.service';
import StatusBadge from '../StatusBadge';
import ProgressBar from '../ProgressBar';
import { formatDateTime } from '../../formatSubmissionDate';
import SurveyFormSheetLink from './SurveyFormSheetLink';
import StudentSurveyResponseClient from './StudentSurveyResponseClient';
import type { SurveyFormDetail, SurveyFormResponsesDetail, SurveyFormStatus } from '../../types';

const STATUS_OPTIONS: Array<{ value: SurveyResponseStatusFilter; label: string }> = [
   { value: 'ALL', label: '전체' },
   { value: 'RESPONDED', label: '응답완료' },
   { value: 'NOT_RESPONDED', label: '미응답' },
];

const FORM_STATUS_LABEL: Record<SurveyFormStatus, string> = {
   DRAFT: '임시저장',
   PUBLISHED: '발행됨',
   CLOSED: '마감됨',
};

const PAGE_SIZE = 20;

interface FormDetailClientProps {
   formId: string;
}

export default function FormDetailClient({ formId }: FormDetailClientProps) {
   const { role } = useAuth();
   const router = useRouter();
   const surveyFormId = Number(formId);

   const [detail, setDetail] = useState<SurveyFormDetail | null>(null);
   const [isLoadingDetail, setIsLoadingDetail] = useState(true);
   const [detailError, setDetailError] = useState(false);
   const [detailRetryKey, setDetailRetryKey] = useState(0);

   const [responses, setResponses] = useState<SurveyFormResponsesDetail | null>(null);
   const [isLoadingResponses, setIsLoadingResponses] = useState(true);
   const [responsesError, setResponsesError] = useState(false);
   const [responsesRetryKey, setResponsesRetryKey] = useState(0);

   const [keyword, setKeyword] = useState('');
   const [statusFilter, setStatusFilter] = useState<SurveyResponseStatusFilter>('ALL');
   const [currentPage, setCurrentPage] = useState(1);
   const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

   useEffect(() => {
      if (!Number.isInteger(surveyFormId) || role === 'STUDENT') return;
      let isMounted = true;
      getSurveyFormDetail(surveyFormId)
         .then((result) => {
            if (isMounted) setDetail(result);
         })
         .catch((err) => {
            if (!isMounted) return;
            if (err instanceof ApiError && err.code === 'SURVEY_001') {
               toast.error(err.message);
               router.replace('/submissions?tab=forms');
               return;
            }
            if (err instanceof ApiError && err.code === 'SURVEY_005') {
               toast.error('접근할 수 없는 설문입니다.');
            }
            setDetailError(true);
         })
         .finally(() => {
            if (isMounted) setIsLoadingDetail(false);
         });
      return () => {
         isMounted = false;
      };
   }, [surveyFormId, detailRetryKey, router, role]);

   useEffect(() => {
      if (!Number.isInteger(surveyFormId) || role === 'STUDENT') return;
      let isMounted = true;
      getSurveyFormResponses(surveyFormId, {
         keyword: keyword || undefined,
         responseStatus: statusFilter === 'ALL' ? undefined : statusFilter,
         page: currentPage - 1,
         size: PAGE_SIZE,
      })
         .then((result) => {
            if (isMounted) setResponses(result);
         })
         .catch(() => {
            if (isMounted) setResponsesError(true);
         })
         .finally(() => {
            if (isMounted) setIsLoadingResponses(false);
         });
      return () => {
         isMounted = false;
      };
   }, [surveyFormId, keyword, statusFilter, currentPage, responsesRetryKey, role]);

   const retryDetail = () => {
      setIsLoadingDetail(true);
      setDetailError(false);
      setDetailRetryKey((key) => key + 1);
   };

   const retryResponses = () => {
      setIsLoadingResponses(true);
      setResponsesError(false);
      setResponsesRetryKey((key) => key + 1);
   };

   const handleSearch = (value: string) => {
      setKeyword(value);
      setCurrentPage(1);
   };

   const handleStatusChange = (value: SurveyResponseStatusFilter) => {
      setStatusFilter(value);
      setCurrentPage(1);
   };

   const handleLinked = () => {
      setDetailRetryKey((key) => key + 1);
   };

   const handleDownloadPdf = async () => {
      if (!detail || isDownloadingPdf) return;
      setIsDownloadingPdf(true);
      try {
         const { blob, filename } = await downloadSurveySummaryPdf(detail.surveyFormId);
         const url = URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = filename ?? `${detail.title}_요약.pdf`;
         a.click();
         URL.revokeObjectURL(url);
      } catch (err) {
         if (err instanceof ApiError && err.code === 'SURVEY_006') {
            toast.error('Google Sheet 연결 설정이 필요합니다. 아래에서 연결해주세요.');
         } else if (err instanceof ApiError && err.code === 'SURVEY_007') {
            toast.error('요약할 응답이 없습니다.');
         } else if (err instanceof ApiError && err.code === 'SHEET_002') {
            toast.error('Google Sheet 공유 권한을 확인해주세요.');
         } else {
            toast.error(
               err instanceof ApiError
                  ? err.message
                  : 'PDF 생성에 실패했습니다. 잠시 후 다시 시도해주세요.',
            );
         }
      } finally {
         setIsDownloadingPdf(false);
      }
   };

   if (role === 'STUDENT') return <StudentSurveyResponseClient formId={formId} />;

   if (!Number.isInteger(surveyFormId)) {
      return (
         <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
            <Link
               href="/submissions?tab=forms"
               className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
               <ChevronLeft size={16} />
               목록으로
            </Link>
            <p className="mt-10 text-center text-sm text-gray-400">폼을 찾을 수 없습니다.</p>
         </div>
      );
   }

   return (
      <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
         <Link
            href="/submissions?tab=forms"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
         >
            <ChevronLeft size={16} />
            목록으로
         </Link>
         <h1 className="mt-3 text-2xl font-bold text-gray-900">응답 현황 상세</h1>

         {isLoadingDetail && !detail ? (
            <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>
         ) : detailError || !detail ? (
            <div className="flex flex-col items-center gap-3 py-16">
               <p className="text-sm text-gray-400">설문 폼 정보를 불러오지 못했습니다.</p>
               <button
                  type="button"
                  onClick={retryDetail}
                  className="cursor-pointer rounded-xs border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
               >
                  다시 시도
               </button>
            </div>
         ) : (
            <>
               <div className="mt-5 rounded-xs border border-[#E5E7EB] bg-white p-6">
                  <div className="flex items-start justify-between">
                     <div>
                        <h2 className="text-lg font-bold text-gray-900">{detail.title}</h2>
                        <div className="mt-2 flex items-center gap-2">
                           <StatusBadge tone={detail.status === 'PUBLISHED' ? 'success' : 'neutral'}>
                              {FORM_STATUS_LABEL[detail.status]}
                           </StatusBadge>
                        </div>
                     </div>
                     <div className="flex items-start gap-4">
                        <div className="text-right">
                           <p className="text-xs text-gray-400">마감일</p>
                           <p className="mt-1 text-sm font-medium text-gray-900">
                              {formatDateTime(detail.dueAt)}
                           </p>
                        </div>
                        <a
                           href={detail.editUrl}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="flex items-center gap-1 rounded-xs border border-gray-200 px-3 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                           <ExternalLink size={12} />
                           Google Form 편집
                        </a>
                     </div>
                  </div>
               </div>

               <div className="mt-6 rounded-xs border border-[#E5E7EB] bg-white">
                  <div className="flex items-center justify-between p-5">
                     <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-900">
                           {responses?.respondedCount ?? 0}/{responses?.targetCount ?? 0} 응답완료
                        </span>
                        <ProgressBar
                           value={responses?.respondedCount ?? 0}
                           max={responses?.targetCount ?? 0}
                           className="w-40"
                        />
                     </div>
                     <div className="flex items-center gap-2">
                        <SearchInput onSearch={handleSearch} placeholder="이름 검색" className="w-64" />
                        <Select
                           value={statusFilter}
                           onValueChange={(value) =>
                              value && handleStatusChange(value as SurveyResponseStatusFilter)
                           }
                        >
                           <SelectTrigger className="data-[size=default]:h-10 w-32 rounded-xs bg-white">
                              <SelectValue placeholder="전체">
                                 {(value: SurveyResponseStatusFilter | null) =>
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

                  {isLoadingResponses && !responses ? (
                     <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>
                  ) : responsesError || !responses ? (
                     <div className="flex flex-col items-center gap-3 py-16">
                        <p className="text-sm text-gray-400">응답 현황을 불러오지 못했습니다.</p>
                        <button
                           type="button"
                           onClick={retryResponses}
                           className="cursor-pointer rounded-xs border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                           다시 시도
                        </button>
                     </div>
                  ) : (
                     <>
                        <table className="w-full table-fixed text-left text-sm">
                           <thead>
                              <tr className="border-y border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
                                 <th className="w-[46%] px-6 py-3 font-medium">이름</th>
                                 <th className="w-[22%] px-6 py-3 font-medium">응답 여부</th>
                                 <th className="w-[32%] px-6 py-3 font-medium">응답 시각</th>
                              </tr>
                           </thead>
                           <tbody>
                              {responses.students.map((student) => (
                                 <tr
                                    key={student.userId}
                                    className="border-b border-[#F3F4F6] last:border-b-0"
                                 >
                                    <td className="px-6 py-4">
                                       <div className="flex items-center gap-2">
                                          <ChatAvatar name={student.name} size="sm" />
                                          <div className="min-w-0">
                                             <p className="truncate font-medium text-gray-900">
                                                {student.name}
                                             </p>
                                             <p className="truncate text-xs text-gray-400">
                                                {student.email}
                                             </p>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-6 py-4">
                                       <StatusBadge tone={student.responded ? 'success' : 'muted'}>
                                          {student.responded ? '응답완료' : '미응답'}
                                       </StatusBadge>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                       {formatDateTime(student.submittedAt)}
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>

                        <div className="p-5">
                           <Pagination
                              currentPage={currentPage}
                              totalPages={responses.totalPages}
                              onPageChange={setCurrentPage}
                           />
                        </div>
                     </>
                  )}
               </div>

               <div className="mt-6 flex flex-col gap-4">
                  <div className="flex justify-end">
                     <button
                        type="button"
                        onClick={handleDownloadPdf}
                        disabled={isDownloadingPdf}
                        className="flex cursor-pointer items-center gap-1.5 rounded-xs bg-brand-green px-3 py-2 text-xs font-medium text-white hover:bg-[#4D655A] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                     >
                        <Download size={12} />
                        {isDownloadingPdf ? '생성 중...' : '평가 요약 결과 다운로드'}
                     </button>
                  </div>
                  <SurveyFormSheetLink
                     surveyFormId={detail.surveyFormId}
                     sheetLink={detail.sheetLink}
                     onLinked={handleLinked}
                  />
               </div>
            </>
         )}
      </div>
   );
}
