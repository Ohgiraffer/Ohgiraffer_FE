'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ExternalLink, TriangleAlert } from 'lucide-react';
import { toast } from '@/lib/toast';
import { ApiError } from '@/lib/http';
import { getSurveyFormDetail } from '@/services/surveyForm.service';
import type { SurveyFormDetail } from '../../types';

interface StudentSurveyResponseClientProps {
   formId: string;
}

export default function StudentSurveyResponseClient({ formId }: StudentSurveyResponseClientProps) {
   const router = useRouter();
   const surveyFormId = Number(formId);

   const [detail, setDetail] = useState<SurveyFormDetail | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [hasError, setHasError] = useState(false);

   useEffect(() => {
      if (!Number.isInteger(surveyFormId)) return;
      let isMounted = true;
      getSurveyFormDetail(surveyFormId)
         .then((result) => {
            if (isMounted) setDetail(result);
         })
         .catch((err) => {
            if (!isMounted) return;
            if (err instanceof ApiError && err.code === 'SURVEY_001') {
               toast.error(err.message);
               router.replace('/submissions');
               return;
            }
            if (err instanceof ApiError && err.code === 'SURVEY_005') {
               toast.error('접근할 수 없는 설문입니다.');
            }
            setHasError(true);
         })
         .finally(() => {
            if (isMounted) setIsLoading(false);
         });
      return () => {
         isMounted = false;
      };
   }, [surveyFormId, router]);

   if (!Number.isInteger(surveyFormId)) {
      return (
         <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
            <Link
               href="/submissions"
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
            href="/submissions"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
         >
            <ChevronLeft size={16} />
            목록으로
         </Link>

         {isLoading ? (
            <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>
         ) : hasError || !detail ? (
            <p className="mt-10 text-center text-sm text-gray-400">설문을 불러오지 못했습니다.</p>
         ) : (
            <>
               <h1 className="mt-3 text-2xl font-bold text-gray-900">{detail.title}</h1>

               <div className="mt-4 flex items-start gap-2 rounded-xs bg-[#F5DFDC] px-4 py-3 text-xs text-brand-maroon">
                  <TriangleAlert size={14} className="mt-0.5 shrink-0" />
                  <div>
                     <p>부트캠프에 등록한 Google 이메일과 동일한 계정으로 응답해 주세요.</p>
                     <p>
                        현재 계정이 다르거나 로그인되어 있지 않다면 로그인 또는 계정 전환이 필요하며,
                     </p>
                     <p>이 과정에서 설문이 새 탭으로 열릴 수 있습니다.</p>
                     <p>다른 이메일로 응답하면 미응답으로 표시될 수 있습니다.</p>
                  </div>
               </div>

               <div className="mt-5 overflow-hidden rounded-sm border border-[#E5E7EB] bg-white">
                  <p className="border-b border-[#E5E7EB] px-6 py-4 text-sm text-gray-500">
                     구글 폼을 통해 응답합니다
                  </p>

                  <div className="flex h-[70vh] items-center justify-center bg-gray-50 p-6">
                     {detail.responseUrl ? (
                        <iframe
                           src={detail.responseUrl}
                           className="h-full w-full rounded-sm bg-white"
                           title={detail.title}
                        />
                     ) : (
                        <p className="text-sm text-gray-400">응답 링크를 찾을 수 없습니다.</p>
                     )}
                  </div>

                  {detail.responseUrl && (
                     <div className="flex justify-end border-t border-[#E5E7EB] p-4">
                        <a
                           href={detail.responseUrl}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="flex items-center gap-1.5 rounded-sm bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-[#4D655A]"
                        >
                           <ExternalLink size={14} />
                           응답 제출
                        </a>
                     </div>
                  )}
               </div>
            </>
         )}
      </div>
   );
}
