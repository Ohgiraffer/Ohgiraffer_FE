'use client';

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
      <div className="mt-4 overflow-hidden rounded-sm border border-[#E5E7EB] bg-white">
         <table className="w-full table-fixed text-left text-sm">
            <thead>
               <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
                  <th className="w-[8%] px-6 py-3 font-medium">#</th>
                  <th className="w-[26%] px-6 py-3 font-medium">폼 제목</th>
                  <th className="w-[14%] px-6 py-3 font-medium text-center">상태</th>
                  <th className="w-[16%] px-6 py-3 font-medium text-center">응답 마감일</th>
                  <th className="w-[16%] px-6 py-3 font-medium text-center">응답 현황</th>
                  <th className="w-[20%] px-6 py-3 font-medium text-center">관리</th>
               </tr>
            </thead>
            <tbody>
               {forms.map((form, index) => (
                  <tr
                     key={form.surveyFormId}
                     onClick={() => router.push(`/submissions/forms/${form.surveyFormId}`)}
                     className="group cursor-pointer border-b border-[#F3F4F6] transition-colors last:border-b-0 hover:bg-[#F9FAFB]"
                  >
                     <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                     <td className="px-6 py-4 font-medium text-gray-900">
                        <span className="group-hover:font-bold group-hover:underline">
                           {form.title}
                        </span>
                     </td>
                     <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                           <StatusBadge tone={STATUS_TONE[form.status]}>
                              {STATUS_LABEL[form.status]}
                           </StatusBadge>
                        </div>
                     </td>
                     <td className="px-6 py-4 text-center text-gray-500">
                        {formatDateTime(form.dueAt)}
                     </td>
                     <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                           <ProgressBar value={form.respondedCount} max={form.targetCount} />
                           <span className="whitespace-nowrap text-gray-700">
                              {form.respondedCount}/{form.targetCount} 응답
                           </span>
                        </div>
                     </td>
                     <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2 text-sm">
                           <button
                              type="button"
                              onClick={(e) => {
                                 e.stopPropagation();
                                 onEdit(form);
                              }}
                              className="flex cursor-pointer items-center gap-1 rounded-xs border border-gray-200 px-2 py-1 text-[#6B7280] hover:bg-[#E5E7EB]"
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
                              className="flex cursor-pointer items-center gap-1 rounded-xs border border-gray-200 px-2 py-1 text-brand-maroon hover:bg-[#E5E7EB]"
                           >
                              <Trash2 size={14} />
                              삭제
                           </button>
                        </div>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
   );
}
