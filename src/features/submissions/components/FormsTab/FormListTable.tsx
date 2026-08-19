'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import StatusBadge from '../StatusBadge';
import ProgressBar from '../ProgressBar';
import { formatDateTime } from '../../formatSubmissionDate';
import type { SurveyFormListItem, SurveyFormStatus } from '../../types';

interface FormListTableProps {
   forms: SurveyFormListItem[];
   onEdit: (form: SurveyFormListItem) => void;
   onDelete: (form: SurveyFormListItem) => void;
}

const STATUS_LABEL: Record<SurveyFormStatus, string> = {
   DRAFT: '임시저장',
   PUBLISHED: '발행됨',
   CLOSED: '마감됨',
};

const STATUS_TONE: Record<SurveyFormStatus, 'success' | 'neutral' | 'muted'> = {
   DRAFT: 'neutral',
   PUBLISHED: 'success',
   CLOSED: 'muted',
};

export default function FormListTable({ forms, onEdit, onDelete }: FormListTableProps) {
   const router = useRouter();

   return (
      <>
         {/* 테두리/배경은 FormsTab의 바깥 카드(AnimatedHeight를 감싸는 div)가 로딩/빈 상태와
            공통으로 담당한다 - 여기서 또 border를 주면 상태가 바뀔 때마다 카드 프레임 자체가
            통째로 갈아끼워져서(다른 DOM), 결재 처리 탭처럼 하나의 카드가 부드럽게 늘었다 줄었다
            하는 게 아니라 카드가 사라졌다 다시 나타나는 것처럼 보인다 */}
         <div className="divide-y divide-[#F3F4F6] md:hidden">
            {forms.map((form, index) => (
               <div
                  key={form.surveyFormId}
                  onClick={() => router.push(`/submissions/forms/${form.surveyFormId}`)}
                  className="cursor-pointer p-4 transition-colors hover:bg-[#F9FAFB]"
               >
                  <div className="flex items-start justify-between gap-2">
                     <div className="min-w-0">
                        <p className="text-xs text-gray-400">#{index + 1}</p>
                        <Link
                           href={`/submissions/forms/${form.surveyFormId}`}
                           onClick={(e) => e.stopPropagation()}
                           className="mt-0.5 block truncate text-sm font-bold text-gray-900"
                        >
                           {form.title}
                        </Link>
                     </div>
                     <StatusBadge tone={STATUS_TONE[form.status]} className="shrink-0">
                        {STATUS_LABEL[form.status]}
                     </StatusBadge>
                  </div>

                  <p className="mt-2 text-xs text-gray-400">
                     응답 마감 {formatDateTime(form.dueAt)}
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                     <ProgressBar value={form.respondedCount} max={form.targetCount} />
                     <span className="whitespace-nowrap text-xs text-gray-700">
                        {form.respondedCount}/{form.targetCount} 응답
                     </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                     <button
                        type="button"
                        onClick={(e) => {
                           e.stopPropagation();
                           onEdit(form);
                        }}
                        className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-xs border border-gray-200 px-2 py-1.5 text-xs text-[#6B7280] hover:bg-[#E5E7EB]"
                     >
                        <Pencil size={14} />
                        수정
                     </button>
                     <button
                        type="button"
                        onClick={(e) => {
                           e.stopPropagation();
                           onDelete(form);
                        }}
                        className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-xs border border-gray-200 px-2 py-1.5 text-xs text-brand-maroon hover:bg-[#E5E7EB]"
                     >
                        <Trash2 size={14} />
                        삭제
                     </button>
                  </div>
               </div>
            ))}
         </div>

         <table className="hidden w-full table-fixed text-left text-sm md:table">
            <thead>
               <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
                  <th className="w-[8%] px-6 py-3 font-medium">#</th>
                  <th className="w-[26%] px-6 py-3 font-medium">폼 제목</th>
                  <th className="w-[12%] px-6 py-3 font-medium text-center">상태</th>
                  <th className="w-[16%] px-6 py-3 font-medium text-center">응답 마감일</th>
                  <th className="w-[20%] px-6 py-3 font-medium text-center">응답 현황</th>
                  <th className="w-[18%] px-6 py-3 font-medium text-center">관리</th>
               </tr>
            </thead>
            <tbody>
               {forms.map((form, index) => {
                  const [dueDate, dueTime] = formatDateTime(form.dueAt).split(' ');
                  return (
                     <tr
                        key={form.surveyFormId}
                        onClick={() => router.push(`/submissions/forms/${form.surveyFormId}`)}
                        className="group cursor-pointer border-b border-[#F3F4F6] transition-colors last:border-b-0 hover:bg-[#F9FAFB]"
                     >
                        <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">
                           <Link
                              href={`/submissions/forms/${form.surveyFormId}`}
                              onClick={(e) => e.stopPropagation()}
                              title={form.title}
                              className="block truncate group-hover:font-bold group-hover:underline"
                           >
                              {form.title}
                           </Link>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center justify-center">
                              <StatusBadge tone={STATUS_TONE[form.status]}>
                                 {STATUS_LABEL[form.status]}
                              </StatusBadge>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-center text-gray-500">
                           <div className="flex flex-col items-center leading-tight xl:flex-row xl:justify-center xl:gap-1 xl:leading-normal">
                              <span className="whitespace-nowrap">{dueDate}</span>
                              <span className="whitespace-nowrap">{dueTime}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex flex-col items-center gap-1 xl:flex-row xl:justify-center xl:gap-2">
                              <ProgressBar
                                 value={form.respondedCount}
                                 max={form.targetCount}
                                 className="w-24 lg:w-35 xl:w-42"
                              />
                              <span className="whitespace-nowrap text-xs text-gray-700 md:text-sm">
                                 {form.respondedCount}/{form.targetCount} 응답
                              </span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex flex-col items-center gap-1.5 text-sm xl:flex-row xl:justify-center xl:gap-2">
                              <button
                                 type="button"
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(form);
                                 }}
                                 className="flex w-full cursor-pointer items-center justify-center gap-1 rounded-xs border border-gray-200 px-2 py-1 text-[#6B7280] hover:bg-[#E5E7EB] xl:w-auto"
                              >
                                 <Pencil size={14} />
                                 수정
                              </button>
                              <button
                                 type="button"
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(form);
                                 }}
                                 className="flex w-full cursor-pointer items-center justify-center gap-1 rounded-xs border border-gray-200 px-2 py-1 text-brand-maroon hover:bg-[#E5E7EB] xl:w-auto"
                              >
                                 <Trash2 size={14} />
                                 삭제
                              </button>
                           </div>
                        </td>
                     </tr>
                  );
               })}
            </tbody>
         </table>
      </>
   );
}
