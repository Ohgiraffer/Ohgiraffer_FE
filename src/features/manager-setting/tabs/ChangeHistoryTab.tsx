'use client';

import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import SearchInput from '@/components/ui/SearchInput';
import Pagination from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/loading/Skeleton';
import { useChangeHistory } from '../hooks/useChangeHistory';

const PAGE_SIZE = 6;

export default function ChangeHistoryTab() {
   const { logs, isLoading, loadError } = useChangeHistory();
   const [keyword, setKeyword] = useState('');
   const [currentPage, setCurrentPage] = useState(1);

   const filteredHistory = useMemo(() => {
      if (!keyword) return logs;
      const lowerKeyword = keyword.toLowerCase();
      return logs.filter(
         (entry) =>
            entry.changedField.toLowerCase().includes(lowerKeyword) ||
            entry.changedByName.toLowerCase().includes(lowerKeyword),
      );
   }, [logs, keyword]);

   const totalPages = Math.max(1, Math.ceil(filteredHistory.length / PAGE_SIZE));
   const pagedHistory = filteredHistory.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE,
   );

   const handleSearch = (value: string) => {
      setKeyword(value);
      setCurrentPage(1);
   };

   if (isLoading) {
      return (
         <div>
            <Skeleton width={288} height={40} className="rounded-xs" />

            <div className="mt-4 overflow-hidden rounded-sm border border-[#E5E7EB] bg-white">
               <table className="w-full table-fixed text-left text-sm">
                  <thead>
                     <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
                        <th className="w-[6%] px-6 py-3 font-medium">#</th>
                        <th className="w-[10%] px-6 py-3 text-center font-medium">변경 사용자</th>
                        <th className="w-[16%] px-6 py-3 text-center font-medium">변경 시각</th>
                        <th className="w-[18%] px-6 py-3 font-medium">변경 항목</th>
                        <th className="w-[23%] px-6 py-3 font-medium">변경 전 값</th>
                        <th className="w-[27%] px-6 py-3 font-medium">변경 후 값</th>
                     </tr>
                  </thead>
                  <tbody>
                     {[0, 1, 2, 3, 4].map((i) => (
                        <tr key={i} className="border-b border-[#F3F4F6] last:border-b-0">
                           <td className="px-6 py-4">
                              <Skeleton width={16} height={14} className="rounded-md" />
                           </td>
                           <td className="px-6 py-4">
                              <Skeleton width={48} height={14} className="mx-auto rounded-md" />
                           </td>
                           <td className="px-6 py-4">
                              <Skeleton width={96} height={14} className="mx-auto rounded-md" />
                           </td>
                           <td className="px-6 py-4">
                              <Skeleton width="70%" height={14} className="rounded-md" />
                           </td>
                           <td className="px-6 py-4">
                              <Skeleton width="80%" height={14} className="rounded-md" />
                           </td>
                           <td className="px-6 py-4">
                              <Skeleton width="60%" height={14} className="rounded-md" />
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      );
   }

   if (loadError) {
      return (
         <div className="rounded-sm border border-[#E5E7EB] bg-white px-8 py-10 text-center text-sm text-brand-red">
            {loadError}
         </div>
      );
   }

   return (
      <div>
         <SearchInput
            onSearch={handleSearch}
            placeholder="변경 항목·사용자 검색"
            className="w-72"
         />

         {pagedHistory.length === 0 ? (
            <div className="mt-4 rounded-sm border border-[#E5E7EB] bg-white px-6 py-10 text-center text-gray-400">
               변경 이력이 없습니다.
            </div>
         ) : (
            <>
               {/* 좁은 화면 - 카드형 목록 */}
               <div className="mt-4 divide-y divide-[#F3F4F6] overflow-hidden rounded-sm border border-[#E5E7EB] bg-white md:hidden">
                  {pagedHistory.map((entry, index) => {
                     const rowNumber = (currentPage - 1) * PAGE_SIZE + index + 1;

                     return (
                        <div key={entry.id} className="p-4">
                           <div className="flex items-center justify-between gap-2">
                              <span className="text-xs text-gray-400">#{rowNumber}</span>
                              <span className="text-xs text-gray-900">{entry.changedByName}</span>
                           </div>
                           <p className="mt-1 text-xs text-gray-400">
                              {format(parseISO(entry.changedAt), 'yyyy-MM-dd HH:mm')}
                           </p>
                           <p className="mt-2 text-sm font-semibold text-brand-green">
                              {entry.changedField}
                           </p>
                           <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm">
                              <span className="text-gray-400 line-through">{entry.oldValue}</span>
                              <span className="text-gray-400">→</span>
                              <span className="font-semibold text-gray-900">{entry.newValue}</span>
                           </p>
                        </div>
                     );
                  })}
               </div>

               {/* 넓은 화면 - 테이블 */}
               <div className="mt-4 hidden overflow-hidden rounded-sm border border-[#E5E7EB] bg-white md:block">
                  <table className="w-full table-fixed text-left text-sm">
                     <thead>
                        <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
                           <th className="w-[6%] px-8 py-3 font-medium">#</th>
                           <th className="w-[12%] px-6 py-3 text-center font-medium">변경 사용자</th>
                           <th className="w-[18%] px-6 py-3 text-center font-medium">변경 시각</th>
                           <th className="w-[18%] px-6 py-3 font-medium">변경 항목</th>
                           <th className="w-[23%] px-6 py-3 font-medium">변경 전 값</th>
                           <th className="w-[23%] px-6 py-3 font-medium">변경 후 값</th>
                        </tr>
                     </thead>
                     <tbody>
                        {pagedHistory.map((entry, index) => {
                           const rowNumber = (currentPage - 1) * PAGE_SIZE + index + 1;

                           return (
                              <tr key={entry.id} className="border-b border-[#F3F4F6] last:border-b-0">
                                 <td className="px-8 py-4 text-gray-500">{rowNumber}</td>
                                 <td className="px-6 py-4 text-center text-gray-900">
                                    {entry.changedByName}
                                 </td>
                                 <td className="px-6 py-4 text-center text-gray-700">
                                    {format(parseISO(entry.changedAt), 'yyyy-MM-dd HH:mm')}
                                 </td>
                                 <td className="px-6 py-4  font-semibold text-brand-green">
                                    {entry.changedField}
                                 </td>
                                 <td className="px-6 py-4 text-gray-400 line-through">
                                    {entry.oldValue}
                                 </td>
                                 <td className="px-6 py-4 font-semibold text-gray-900">
                                    {entry.newValue}
                                 </td>
                              </tr>
                           );
                        })}
                     </tbody>
                  </table>
               </div>
            </>
         )}

         <div className="mt-6">
            <Pagination
               currentPage={currentPage}
               totalPages={totalPages}
               onPageChange={setCurrentPage}
            />
         </div>
      </div>
   );
}
