'use client';

import { useMemo, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import SearchInput from '@/components/ui/SearchInput';
import Pagination from '@/components/ui/Pagination';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/shadcn/select';
import { MOCK_CHANGE_HISTORY } from '../mockData';

const PAGE_SIZE = 6;

export default function ChangeHistoryTab() {
   const [keyword, setKeyword] = useState('');
   const [categoryFilter, setCategoryFilter] = useState('all');
   const [currentPage, setCurrentPage] = useState(1);

   const categories = useMemo(
      () => Array.from(new Set(MOCK_CHANGE_HISTORY.map((entry) => entry.category))),
      [],
   );

   const filteredHistory = useMemo(() => {
      return MOCK_CHANGE_HISTORY.filter((entry) => {
         const matchesKeyword =
            !keyword ||
            entry.itemLabel.toLowerCase().includes(keyword.toLowerCase()) ||
            entry.changedBy.toLowerCase().includes(keyword.toLowerCase());
         const matchesCategory = categoryFilter === 'all' || entry.category === categoryFilter;
         return matchesKeyword && matchesCategory;
      });
   }, [keyword, categoryFilter]);

   const totalPages = Math.max(1, Math.ceil(filteredHistory.length / PAGE_SIZE));
   const pagedHistory = filteredHistory.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE,
   );

   const handleSearch = (value: string) => {
      setKeyword(value);
      setCurrentPage(1);
   };

   const handleCategoryChange = (value: string | null) => {
      if (!value) return;
      setCategoryFilter(value);
      setCurrentPage(1);
   };

   return (
      <div>
         <div className="flex items-center gap-2">
            <SearchInput
               onSearch={handleSearch}
               placeholder="변경 항목·사용자 검색"
               className="w-72"
            />
            <Select value={categoryFilter} onValueChange={handleCategoryChange}>
               <SelectTrigger className="data-[size=default]:h-10 rounded-xs bg-white">
                  <SelectValue placeholder="분류">
                     {(value: string | null) => (!value || value === 'all' ? '전체' : value)}
                  </SelectValue>
               </SelectTrigger>
               <SelectContent alignItemWithTrigger={false} align="start" sideOffset={4}>
                  <SelectItem value="all" className="cursor-pointer">
                     전체
                  </SelectItem>
                  {categories.map((category) => (
                     <SelectItem key={category} value={category} className="cursor-pointer">
                        {category}
                     </SelectItem>
                  ))}
               </SelectContent>
            </Select>
         </div>

         <div className="mt-4 overflow-hidden rounded-sm border border-[#E5E7EB] bg-white">
            <table className="w-full table-fixed text-left text-sm">
               <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
                     <th className="w-[6%] px-6 py-3 font-medium">#</th>
                     <th className="w-[10%] px-6 py-3 font-medium">변경 사용자</th>
                     <th className="w-[14%] px-6 py-3 text-center font-medium">변경 시각</th>
                     <th className="w-[20%] px-6 py-3 font-medium">변경 항목</th>
                     <th className="w-[24%] px-6 py-3 font-medium">변경 전 값</th>
                     <th className="w-[24%] px-6 py-3 font-medium">변경 후 값</th>
                  </tr>
               </thead>
               <tbody>
                  {pagedHistory.map((entry, index) => {
                     const rowNumber = (currentPage - 1) * PAGE_SIZE + index + 1;

                     return (
                        <tr
                           key={entry.id}
                           className={`border-b border-[#F3F4F6] last:border-b-0 ${
                              entry.isFlagged ? 'border-l-4 border-l-brand-maroon' : ''
                           }`}
                        >
                           <td className="px-6 py-4 text-gray-500">{rowNumber}</td>
                           <td className="px-6 py-4">
                              <span className="flex items-center gap-1.5 text-gray-900">
                                 {entry.isFlagged && (
                                    <TriangleAlert size={14} className="text-brand-maroon" />
                                 )}
                                 {entry.changedBy}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-gray-700 text-center">{entry.changedAt}</td>
                           <td className="px-6 py-4">
                              <p
                                 className={`font-semibold ${
                                    entry.isFlagged ? 'text-brand-maroon' : 'text-gray-900'
                                 }`}
                              >
                                 {entry.itemLabel}
                              </p>
                              <p className="text-xs text-[#9CA3AF]">{entry.category}</p>
                           </td>
                           <td className="px-6 py-4 text-gray-400 line-through">
                              {entry.beforeValue}
                           </td>
                           <td className="px-6 py-4 font-semibold text-gray-900">
                              {entry.afterValue}
                           </td>
                        </tr>
                     );
                  })}
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
