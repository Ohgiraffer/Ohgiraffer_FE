'use client';

import Link from 'next/link';
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
      <>
         <div className="mt-4 divide-y divide-[#F3F4F6] overflow-hidden rounded-sm border border-[#E5E7EB] bg-white sm:hidden">
            {boxes.map((box, index) => (
               <div
                  key={box.submissionBoxId}
                  onClick={() => router.push(`/submissions/boxes/${box.submissionBoxId}`)}
                  className="cursor-pointer p-4 transition-colors hover:bg-[#F9FAFB]"
               >
                  <div className="flex items-start justify-between gap-2">
                     <div className="min-w-0">
                        <p className="text-xs text-gray-400">#{index + 1}</p>
                        <Link
                           href={`/submissions/boxes/${box.submissionBoxId}`}
                           onClick={(e) => e.stopPropagation()}
                           className="mt-0.5 block truncate text-sm font-bold text-gray-900"
                        >
                           {box.projectName}
                        </Link>
                     </div>
                     <StatusBadge
                        tone={box.latePolicy === 'BLOCK' ? 'danger' : 'neutral'}
                        className="shrink-0"
                     >
                        {box.latePolicy === 'BLOCK' ? '차단' : '허용'}
                     </StatusBadge>
                  </div>

                  <p className="mt-2 text-xs text-gray-400">마감 {formatDateTime(box.dueAt)}</p>

                  <div className="mt-2 flex items-center gap-2">
                     <ProgressBar value={box.submittedCount ?? 0} max={box.targetCount ?? 0} />
                     <span className="whitespace-nowrap text-xs text-gray-700">
                        {box.submittedCount ?? 0}/{box.targetCount ?? 0}{' '}
                        {box.targetScope === 'TEAM' ? '팀 제출' : '명 제출'}
                     </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                     <button
                        type="button"
                        onClick={(e) => {
                           e.stopPropagation();
                           onEdit(box);
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
                           onDelete(box);
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

         <div className="mt-4 hidden overflow-hidden rounded-sm border border-[#E5E7EB] bg-white sm:block">
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
               {boxes.map((box, index) => {
                  const [dueDate, dueTime] = formatDateTime(box.dueAt).split(' ');
                  return (
                     <tr
                        key={box.submissionBoxId}
                        onClick={() => router.push(`/submissions/boxes/${box.submissionBoxId}`)}
                        className="group cursor-pointer border-b border-[#F3F4F6] transition-colors last:border-b-0 hover:bg-[#F9FAFB]"
                     >
                        <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">
                           <Link
                              href={`/submissions/boxes/${box.submissionBoxId}`}
                              onClick={(e) => e.stopPropagation()}
                              className="group-hover:font-bold group-hover:underline"
                           >
                              {box.projectName}
                           </Link>
                        </td>
                        <td className="px-6 py-4 text-center text-gray-500">
                           <div className="flex flex-col items-center leading-tight lg:flex-row lg:justify-center lg:gap-1 lg:leading-normal">
                              <span className="whitespace-nowrap">{dueDate}</span>
                              <span className="whitespace-nowrap">{dueTime}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex flex-col items-center gap-1 lg:flex-row lg:justify-center lg:gap-2">
                              <ProgressBar
                                 value={box.submittedCount ?? 0}
                                 max={box.targetCount ?? 0}
                                 className="w-24 lg:w-35"
                              />
                              <span className="whitespace-nowrap text-xs text-gray-700 lg:text-sm">
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
                        <td className="px-6 py-4">
                           <div className="flex flex-col items-center gap-1.5 text-sm lg:flex-row lg:justify-center lg:gap-2">
                              <button
                                 type="button"
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(box);
                                 }}
                                 className="flex w-full cursor-pointer items-center justify-center gap-1 rounded-xs border border-gray-200 px-2 py-1 text-[#6B7280] hover:bg-[#E5E7EB] lg:w-auto"
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
                                 className="flex w-full cursor-pointer items-center justify-center gap-1 rounded-xs border border-gray-200 px-2 py-1 text-brand-maroon hover:bg-[#E5E7EB] lg:w-auto"
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
         </div>
      </>
   );
}
