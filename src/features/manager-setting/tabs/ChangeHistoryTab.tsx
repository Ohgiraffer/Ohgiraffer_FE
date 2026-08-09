'use client';

import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import SearchInput from '@/components/ui/SearchInput';
import Pagination from '@/components/ui/Pagination';
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
         <div className="rounded-sm border border-[#E5E7EB] bg-white px-8 py-10 text-center text-sm text-gray-400">
            불러오는 중...
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
                  {pagedHistory.length === 0 ? (
                     <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                           변경 이력이 없습니다.
                        </td>
                     </tr>
                  ) : (
                     pagedHistory.map((entry, index) => {
                        const rowNumber = (currentPage - 1) * PAGE_SIZE + index + 1;

                        return (
                           <tr key={entry.id} className="border-b border-[#F3F4F6] last:border-b-0">
                              <td className="px-6 py-4 text-gray-500">{rowNumber}</td>
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
                     })
                  )}
               </tbody>
            </table>
         </div>

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
