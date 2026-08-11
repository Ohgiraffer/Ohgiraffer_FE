'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, TriangleAlert } from 'lucide-react';
import { getSubmissionBoxes } from '@/services/submissionBox.service';
import { getSurveyForms } from '@/services/surveyForm.service';
import StatusBadge from './StatusBadge';
import { formatDateTime, formatDday } from '../formatSubmissionDate';

interface MergedItem {
   key: string;
   type: 'box' | 'form';
   id: number;
   title: string;
   dueAt: string;
   isDone: boolean;
}

export default function StudentSubmissionsPageClient() {
   const router = useRouter();
   const [items, setItems] = useState<MergedItem[] | null>(null);
   const [hasError, setHasError] = useState(false);
   // 제출함/설문 중 하나만 조회 실패했을 때 - 성공한 목록은 보여주되 누락을 알려준다
   const [partialError, setPartialError] = useState(false);
   const [reloadKey, setReloadKey] = useState(0);

   useEffect(() => {
      let isMounted = true;
      // 제출함/설문 중 한쪽 조회가 실패해도, 성공한 쪽은 그대로 보여준다 (둘 다 실패했을 때만 전체 오류 처리)
      Promise.allSettled([getSubmissionBoxes(), getSurveyForms()]).then((results) => {
         if (!isMounted) return;
         const [boxesResult, formsResult] = results;
         if (boxesResult.status === 'rejected' && formsResult.status === 'rejected') {
            setHasError(true);
            return;
         }
         setPartialError(boxesResult.status === 'rejected' || formsResult.status === 'rejected');
         const boxes = boxesResult.status === 'fulfilled' ? boxesResult.value : [];
         const forms = formsResult.status === 'fulfilled' ? formsResult.value : [];
         const merged: MergedItem[] = [
            ...boxes.map((box) => ({
               key: `box-${box.submissionBoxId}`,
               type: 'box' as const,
               id: box.submissionBoxId,
               title: box.projectName,
               dueAt: box.dueAt,
               isDone: !!box.submitted,
            })),
            ...forms.map((form) => ({
               key: `form-${form.surveyFormId}`,
               type: 'form' as const,
               id: form.surveyFormId,
               title: form.title,
               dueAt: form.dueAt,
               isDone: !!form.responded,
            })),
         ];
         merged.sort((a, b) => {
            if (a.isDone !== b.isDone) return a.isDone ? 1 : -1;
            return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
         });
         setItems(merged);
      });
      return () => {
         isMounted = false;
      };
   }, [reloadKey]);

   const handleClick = (item: MergedItem) => {
      router.push(item.type === 'box' ? `/submissions/boxes/${item.id}` : `/submissions/forms/${item.id}`);
   };

   const refetch = () => {
      setHasError(false);
      setPartialError(false);
      setItems(null);
      setReloadKey((key) => key + 1);
   };

   return (
      <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
         <h1 className="text-2xl font-bold text-gray-900">제출물 관리</h1>

         {partialError && !hasError && (
            <div className="mt-5 flex items-center justify-between rounded-xs border border-[#F5DFDC] bg-[#FDF4F3] px-4 py-3 text-sm text-brand-maroon">
               <span className="flex items-center gap-2">
                  <TriangleAlert size={14} className="shrink-0" />
                  일부 항목을 불러오지 못해 목록이 정확하지 않을 수 있습니다.
               </span>
               <button
                  type="button"
                  onClick={refetch}
                  className="shrink-0 cursor-pointer rounded-xs border border-brand-maroon/30 px-3 py-1.5 text-xs font-medium text-brand-maroon hover:bg-white"
               >
                  다시 시도
               </button>
            </div>
         )}

         <div className="mt-5 overflow-hidden rounded-sm border border-[#E5E7EB] bg-white">
            <div className="border-b border-[#E5E7EB] px-6 py-4 text-sm font-bold text-gray-900">
               진행 중인 제출함 및 설문
            </div>

            {items === null && !hasError ? (
               <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>
            ) : hasError ? (
               <div className="flex flex-col items-center gap-3 py-16">
                  <p className="text-sm text-gray-400">목록을 불러오지 못했습니다.</p>
                  <button
                     type="button"
                     onClick={refetch}
                     className="cursor-pointer rounded-xs border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                     다시 시도
                  </button>
               </div>
            ) : items && items.length === 0 ? (
               <p className="py-16 text-center text-sm text-gray-400">
                  진행 중인 제출함 또는 설문이 없습니다
               </p>
            ) : (
               items?.map((item) => (
                  <button
                     key={item.key}
                     type="button"
                     onClick={() => handleClick(item)}
                     className="flex w-full cursor-pointer items-center justify-between gap-4 border-b border-[#F3F4F6] px-6 py-4 text-left transition-colors last:border-b-0 hover:bg-[#F9FAFB]"
                  >
                     <div className="flex min-w-0 items-center gap-3">
                        <StatusBadge tone={item.type === 'box' ? 'muted' : 'gold'} className="shrink-0">
                           {item.type === 'box' ? '제출함' : '설문'}
                        </StatusBadge>
                        <div className="min-w-0">
                           <p className="truncate text-sm font-medium text-gray-900">{item.title}</p>
                           <p className="mt-0.5 text-xs text-gray-400">
                              마감 {formatDateTime(item.dueAt)}
                           </p>
                        </div>
                     </div>
                     <div className="flex shrink-0 items-center gap-3">
                        {item.type === 'box' && !item.isDone && (
                           <span className="text-sm font-semibold text-gray-900">
                              {formatDday(item.dueAt)}
                           </span>
                        )}
                        <StatusBadge tone={item.isDone ? 'neutral' : 'danger'}>
                           {item.isDone
                              ? item.type === 'box'
                                 ? '제출완료'
                                 : '응답완료'
                              : item.type === 'box'
                                ? '미제출'
                                : '미응답'}
                        </StatusBadge>
                        <ChevronRight size={16} className="text-gray-300" />
                     </div>
                  </button>
               ))
            )}
         </div>
      </div>
   );
}
