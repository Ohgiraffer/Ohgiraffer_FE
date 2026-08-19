'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import Pagination from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/loading/Skeleton';
import CounselingStatusBadge from '../components/CounselingStatusBadge';
import CounselingDetailModal from '../components/CounselingDetailModal';
import { useMyCounselingHistory } from '../hooks/useMyCounselingHistory';

const PAGE_SIZE = 8;

// 훈련생 "내 상담 이력" 탭 - 예정·완료 상담 목록, 행을 클릭하면 상세 모달
export default function MyCounselingHistoryTab() {
   const { items, isLoading, loadError, detail, openDetail, closeDetail } =
      useMyCounselingHistory();
   const [currentPage, setCurrentPage] = useState(1);

   const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
   const pagedItems = items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

   return (
      <div>
         <div className="overflow-hidden rounded-sm border border-[#E5E7EB] bg-white">
            {isLoading ? (
               <table className="w-full table-fixed text-left text-sm">
                  <thead>
                     <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
                        <th className="w-[8%] px-8 py-3 text-center font-medium">#</th>
                        <th className="w-[32%] px-10 py-3 font-medium">상담 주제</th>
                        <th className="w-[15%] px-6 py-3 font-medium">담당자</th>
                        <th className="w-[25%] px-6 py-3 text-center font-medium">일시</th>
                        <th className="w-[20%] px-6 py-3 text-center font-medium">상태</th>
                     </tr>
                  </thead>
                  <tbody>
                     {[0, 1, 2, 3, 4].map((i) => (
                        <tr key={i} className="border-b border-[#F3F4F6] last:border-b-0">
                           <td className="px-8 py-4">
                              <Skeleton width={16} height={14} className="mx-auto rounded-md" />
                           </td>
                           <td className="px-10 py-4">
                              <Skeleton width="60%" height={14} className="rounded-md" />
                           </td>
                           <td className="px-6 py-4">
                              <Skeleton width="50%" height={14} className="rounded-md" />
                           </td>
                           <td className="px-15 py-4">
                              <Skeleton width="70%" height={14} className="mx-auto rounded-md" />
                           </td>
                           <td className="px-6 py-4">
                              <Skeleton width={56} height={22} className="mx-auto rounded-xs" />
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            ) : loadError ? (
               <p className="px-6 py-10 text-center text-brand-red">{loadError}</p>
            ) : items.length === 0 ? (
               <p className="px-6 py-10 text-center text-gray-400">상담 이력이 없습니다.</p>
            ) : (
               <>
                  {/* 좁은 화면 - 카드형 목록 */}
                  <div className="divide-y divide-[#F3F4F6] md:hidden">
                     {pagedItems.map((item) => (
                        <div
                           key={item.consultationId}
                           onClick={() => openDetail(item.consultationId)}
                           className="cursor-pointer p-4 hover:bg-[#F9FAFB]"
                        >
                           <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-gray-900">{item.topic}</p>
                              <CounselingStatusBadge status={item.status} />
                           </div>
                           <p className="mt-1.5 text-xs text-gray-500">
                              {item.counselorName} ·{' '}
                              {format(parseISO(item.scheduledAt), 'yyyy.MM.dd HH:mm')}
                           </p>
                        </div>
                     ))}
                  </div>

                  {/* 넓은 화면 - 테이블 */}
                  <table className="hidden w-full table-fixed text-left text-sm md:table">
                     <thead>
                        <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
                           <th className="w-[8%] px-8 py-3 text-center font-medium">#</th>
                           <th className="w-[32%] px-10 py-3 font-medium">상담 주제</th>
                           <th className="w-[15%] px-6 py-3 font-medium">담당자</th>
                           <th className="w-[25%] px-6 py-3 text-center font-medium">일시</th>
                           <th className="w-[20%] px-6 py-3 text-center font-medium">상태</th>
                        </tr>
                     </thead>
                     <tbody>
                        {pagedItems.map((item, index) => (
                           <tr
                              key={item.consultationId}
                              onClick={() => openDetail(item.consultationId)}
                              className="cursor-pointer border-b border-[#F3F4F6] last:border-b-0 hover:bg-[#F9FAFB]"
                           >
                              <td className="px-8 py-4 text-center text-gray-500">
                                 {(currentPage - 1) * PAGE_SIZE + index + 1}
                              </td>
                              <td className="px-10 py-4 font-medium text-gray-900">{item.topic}</td>
                              <td className="px-6 py-4 text-gray-700">{item.counselorName}</td>
                              <td className="px-15 py-4 text-center text-gray-500">
                                 {format(parseISO(item.scheduledAt), 'yyyy.MM.dd HH:mm')}
                              </td>
                              <td className="px-6 py-4 text-center">
                                 <CounselingStatusBadge status={item.status} />
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </>
            )}
         </div>

         <div className="mt-6">
            <Pagination
               currentPage={currentPage}
               totalPages={totalPages}
               onPageChange={setCurrentPage}
            />
         </div>

         {detail && <CounselingDetailModal detail={detail} onClose={closeDetail} />}
      </div>
   );
}
