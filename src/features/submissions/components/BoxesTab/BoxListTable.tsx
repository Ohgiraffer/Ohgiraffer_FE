'use client';

import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import StatusBadge from '../StatusBadge';
import ProgressBar from '../ProgressBar';
import { formatDateTime } from '../../formatSubmissionDate';
import type { SubmissionBoxListItem } from '../../types';

interface BoxListTableProps {
   boxes: SubmissionBoxListItem[];
   onEdit: (box: SubmissionBoxListItem) => void;
   onDelete: (box: SubmissionBoxListItem) => void;
}

export default function BoxListTable({ boxes, onEdit, onDelete }: BoxListTableProps) {
   const router = useRouter();

   return (
      <div className="mt-4 overflow-hidden rounded-sm border border-[#E5E7EB] bg-white">
         <table className="w-full table-fixed text-left text-sm">
            <thead>
               <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
                  <th className="w-[4%] px-6 py-3 font-medium">#</th>
                  <th className="w-[26%] px-6 py-3 font-medium text-center">프로젝트명</th>
                  <th className="w-[16%] px-6 py-3 font-medium text-center">마감일</th>
                  <th className="w-[24%] px-6 py-3 font-medium text-center">제출 현황</th>
                  <th className="w-[12%] px-6 py-3 font-medium text-center">지각 제출</th>
                  <th className="w-[18%] px-6 py-3 font-medium text-center">관리</th>
               </tr>
            </thead>
            <tbody>
               {boxes.map((box, index) => (
                  <tr
                     key={box.submissionBoxId}
                     onClick={() => router.push(`/submissions/boxes/${box.submissionBoxId}`)}
                     className="group cursor-pointer border-b border-[#F3F4F6] transition-colors last:border-b-0 hover:bg-[#F9FAFB]"
                  >
                     <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                     <td className="px-6 py-4 font-medium text-gray-900">
                        <span className="group-hover:font-bold group-hover:underline">
                           {box.projectName}
                        </span>
                     </td>
                     <td className="flex items-center justify-center px-6 py-4 text-gray-500">
                        {formatDateTime(box.dueAt)}
                     </td>
                     <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                           <ProgressBar value={box.submittedCount ?? 0} max={box.targetCount ?? 0} />
                           <span className="whitespace-nowrap text-gray-700">
                              {box.submittedCount ?? 0}/{box.targetCount ?? 0}{' '}
                              {box.targetScope === 'TEAM' ? '팀 제출' : '명 제출'}
                           </span>
                        </div>
                     </td>
                     <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                           <StatusBadge tone={box.latePolicy === 'BLOCK' ? 'danger' : 'neutral'}>
                              {box.latePolicy === 'BLOCK' ? '차단' : '허용'}
                           </StatusBadge>
                        </div>
                     </td>
                     <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-center gap-2 text-sm">
                           <button
                              type="button"
                              onClick={(e) => {
                                 e.stopPropagation();
                                 onEdit(box);
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
                                 onDelete(box);
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
