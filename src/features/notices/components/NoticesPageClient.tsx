'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pin, Settings } from 'lucide-react';
import SearchInput from '@/components/ui/SearchInput';
import Pagination from '@/components/ui/Pagination';
import CategoryManageModal from './CategoryManageModal';
import { MOCK_NOTICE_CATEGORIES, MOCK_NOTICES } from '../mockData';
import type { NoticeCategory, NoticeEntry } from '../types';

const PAGE_SIZE = 6;

function createId() {
   return crypto.randomUUID();
}

export default function NoticesPageClient() {
   const router = useRouter();
   const [categories, setCategories] = useState<NoticeCategory[]>(MOCK_NOTICE_CATEGORIES);
   const [notices] = useState<NoticeEntry[]>(MOCK_NOTICES);
   const [activeTab, setActiveTab] = useState('all');
   const [keyword, setKeyword] = useState('');
   const [currentPage, setCurrentPage] = useState(1);
   const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

   // 카테고리별로 이 카테고리를 쓰는 공지가 몇 개인지 - 0개일 때만 삭제 가능
   const categoryNoticeCounts = useMemo(() => {
      const counts = new Map<string, number>();
      for (const notice of notices) {
         counts.set(notice.category, (counts.get(notice.category) ?? 0) + 1);
      }
      return counts;
   }, [notices]);

   const categoryRows = categories.map((category) => ({
      id: category.id,
      name: category.name,
      canDelete: (categoryNoticeCounts.get(category.name) ?? 0) === 0,
   }));

   const filteredNotices = useMemo(() => {
      return notices.filter((notice) => {
         const matchesTab = activeTab === 'all' || notice.category === activeTab;
         const matchesKeyword =
            !keyword ||
            notice.title.toLowerCase().includes(keyword.toLowerCase()) ||
            notice.author.toLowerCase().includes(keyword.toLowerCase());
         return matchesTab && matchesKeyword;
      });
   }, [notices, activeTab, keyword]);

   const totalPages = Math.max(1, Math.ceil(filteredNotices.length / PAGE_SIZE));
   const pagedNotices = filteredNotices.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE,
   );

   const handleTabChange = (tab: string) => {
      setActiveTab(tab);
      setCurrentPage(1);
   };

   const handleSearch = (value: string) => {
      setKeyword(value);
      setCurrentPage(1);
   };

   const addCategory = (name: string) => {
      setCategories((prev) => [...prev, { id: createId(), name }]);
   };

   const removeCategory = (id: string) => {
      const target = categories.find((category) => category.id === id);
      setCategories((prev) => prev.filter((category) => category.id !== id));
      // 삭제한 카테고리가 현재 선택된 탭이었다면 전체 탭으로 되돌림
      if (target && activeTab === target.name) {
         setActiveTab('all');
         setCurrentPage(1);
      }
   };

   return (
      <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
         <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">공지사항</h1>
            <Link
               href="/notices/write"
               className="cursor-pointer rounded-xs bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-[#4D655A]"
            >
               + 공지 작성
            </Link>
         </div>

         <div className="mt-5 rounded-sm border border-[#E5E7EB] bg-white">
            <div className="flex items-stretch justify-between border-b border-[#E5E7EB] px-6">
               <div className="flex items-stretch gap-4 pt-2">
                  <button
                     type="button"
                     onClick={() => handleTabChange('all')}
                     className={`flex cursor-pointer items-center border-b-2 px-3 text-sm transition-colors ${
                        activeTab === 'all'
                           ? 'border-brand-green font-bold text-gray-900'
                           : 'border-transparent font-medium text-gray-400 hover:text-gray-700'
                     }`}
                  >
                     전체
                  </button>
                  {categories.map((category) => (
                     <button
                        key={category.id}
                        type="button"
                        onClick={() => handleTabChange(category.name)}
                        className={`flex cursor-pointer items-center border-b-2 px-3 text-sm transition-colors ${
                           activeTab === category.name
                              ? 'border-brand-green font-bold text-gray-900'
                              : 'border-transparent font-medium text-gray-400 hover:text-gray-700'
                        }`}
                     >
                        {category.name}
                     </button>
                  ))}
                  <button
                     type="button"
                     onClick={() => setIsCategoryModalOpen(true)}
                     aria-label="카테고리 관리"
                     className="mt-1.5 flex cursor-pointer items-center justify-center w-8 h-8 rounded-sm px-1 text-gray-400 hover:bg-gray-50 hover:text-gray-700"
                  >
                     <Settings size={16} />
                  </button>
               </div>

               <div className="flex items-center py-2">
                  <SearchInput
                     onSearch={handleSearch}
                     placeholder="제목 또는 작성자 검색"
                     className="w-72"
                  />
               </div>
            </div>

            <table className="w-full table-fixed text-center text-sm">
               <thead>
                  <tr className="border-b border-[#E5E7EB] text-[#6B7280] bg-[#F9FAFB]">
                     <th className="w-[6%] px-6 py-3 font-medium">#</th>
                     <th className="w-[8%] px-6 py-3 font-medium">고정</th>
                     <th className="w-[32%] px-6 py-3 font-medium">제목</th>
                     <th className="w-[12%] px-6 py-3 font-medium">확인 여부</th>
                     <th className="w-[12%] px-6 py-3 font-medium">카테고리</th>
                     <th className="w-[12%] px-6 py-3 font-medium">작성자</th>
                     <th className="w-[18%] px-6 py-3 font-medium">등록일</th>
                  </tr>
               </thead>
               <tbody>
                  {pagedNotices.map((notice, index) => {
                     const rowNumber = (currentPage - 1) * PAGE_SIZE + index + 1;

                     return (
                        <tr
                           key={notice.id}
                           onClick={() => router.push(`/notices/${notice.id}`)}
                           className={`cursor-pointer border-b border-[#F3F4F6] transition-colors last:border-b-0 hover:bg-[#F9FAFB] ${
                              notice.isPinned ? 'border-l-4 border-l-brand-maroon' : ''
                           }`}
                        >
                           <td className="px-6 py-4 text-gray-500">{rowNumber}</td>
                           <td className="px-6 py-4">
                              {notice.isPinned && (
                                 <div className="flex justify-center">
                                    <Pin size={14} className="text-brand-maroon" />
                                 </div>
                              )}
                           </td>
                           <td className="px-6 py-4 text-left font-medium text-gray-900">
                              {notice.title}
                           </td>
                           <td className="px-6 py-4 font-semibold">
                              {notice.confirmStatus === '완료' ? (
                                 <span className="text-gray-500">완료</span>
                              ) : (
                                 <span className="text-brand-maroon">미완료</span>
                              )}
                           </td>
                           <td className="px-6 py-4 text-gray-700">{notice.category}</td>
                           <td className="px-6 py-4 text-gray-700">{notice.author}</td>
                           <td className="px-6 py-4 text-gray-500">{notice.createdAt}</td>
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

         <CategoryManageModal
            open={isCategoryModalOpen}
            onClose={() => setIsCategoryModalOpen(false)}
            categories={categoryRows}
            onAddCategory={addCategory}
            onRemoveCategory={removeCategory}
         />
      </div>
   );
}
