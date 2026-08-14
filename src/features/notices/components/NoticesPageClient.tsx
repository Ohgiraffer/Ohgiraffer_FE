'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pin, Settings } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import SearchInput from '@/components/ui/SearchInput';
import Pagination from '@/components/ui/Pagination';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import {
   createNoticeCategory,
   deleteNoticeCategory,
   getNoticeCategories,
   getNotices,
   type NoticeCategory,
   type NoticeListItem,
} from '@/services/notice.service';
import { formatNoticeDate } from '../formatNoticeDate';
import CategoryManageModal from './CategoryManageModal';

const PAGE_SIZE = 6;

export default function NoticesPageClient() {
   const router = useRouter();
   const { role } = useAuth();
   const canManageCategories = role === 'INSTRUCTOR' || role === 'MANAGER';
   const canWriteNotice = role === 'INSTRUCTOR' || role === 'MANAGER';
   const [categories, setCategories] = useState<NoticeCategory[]>([]);
   const [notices, setNotices] = useState<NoticeListItem[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [hasError, setHasError] = useState(false);
   const [activeCategoryId, setActiveCategoryId] = useState<number | 'all'>('all');
   const [keyword, setKeyword] = useState('');
   const [currentPage, setCurrentPage] = useState(1);
   const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

   useEffect(() => {
      let isMounted = true;

      Promise.all([getNoticeCategories(), getNotices()])
         .then(([categoryList, noticeList]) => {
            if (!isMounted) return;
            setCategories(categoryList);
            setNotices(noticeList);
         })
         .catch(() => {
            if (!isMounted) return;
            setHasError(true);
         })
         .finally(() => {
            if (isMounted) setIsLoading(false);
         });

      return () => {
         isMounted = false;
      };
   }, []);

   const categoryNoticeCounts = useMemo(() => {
      const counts = new Map<number, number>();
      for (const notice of notices) {
         counts.set(notice.categoryId, (counts.get(notice.categoryId) ?? 0) + 1);
      }
      return counts;
   }, [notices]);

   const categoryRows = categories.map((category) => ({
      id: category.categoryId,
      name: category.name,
      canDelete: (categoryNoticeCounts.get(category.categoryId) ?? 0) === 0,
   }));

   const filteredNotices = useMemo(() => {
      return notices.filter((notice) => {
         const matchesTab = activeCategoryId === 'all' || notice.categoryId === activeCategoryId;
         const matchesKeyword =
            !keyword ||
            notice.title.toLowerCase().includes(keyword.toLowerCase()) ||
            (notice.authorName ?? '').toLowerCase().includes(keyword.toLowerCase());
         return matchesTab && matchesKeyword;
      });
   }, [notices, activeCategoryId, keyword]);

   const totalPages = Math.max(1, Math.ceil(filteredNotices.length / PAGE_SIZE));
   const pagedNotices = filteredNotices.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE,
   );

   const handleTabChange = (categoryId: number | 'all') => {
      setActiveCategoryId(categoryId);
      setCurrentPage(1);
   };

   const handleSearch = (value: string) => {
      setKeyword(value);
      setCurrentPage(1);
   };

   const addCategory = async (name: string) => {
      try {
         const created = await createNoticeCategory(name);
         setCategories((prev) => [...prev, created]);
      } catch (err) {
         toast.error(
            err instanceof ApiError
               ? err.message
               : '카테고리 등록 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
         );
         throw err;
      }
   };

   const removeCategory = async (id: number) => {
      try {
         await deleteNoticeCategory(id);
      } catch (err) {
         
         if (!(err instanceof ApiError && err.code === 'NOTICE_002')) {
            toast.error(
               err instanceof ApiError
                  ? err.message
                  : '카테고리 삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
            );
            throw err;
         }
      }

      setCategories((prev) => prev.filter((category) => category.categoryId !== id));
      if (activeCategoryId === id) {
         setActiveCategoryId('all');
         setCurrentPage(1);
      }
   };

   return (
      <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
         <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">공지사항</h1>
            {canWriteNotice && (
               <Link
                  href="/notices/write"
                  className="cursor-pointer rounded-xs bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-[#4D655A]"
               >
                  + 공지 작성
               </Link>
            )}
         </div>

         <div className="mt-5 rounded-sm border border-[#E5E7EB] bg-white">
            <div className="flex items-stretch justify-between border-b border-[#E5E7EB] px-6">
               <div className="flex items-stretch gap-4 pt-2">
                  <button
                     type="button"
                     onClick={() => handleTabChange('all')}
                     className={`flex cursor-pointer items-center border-b-2 px-3 text-sm transition-colors ${
                        activeCategoryId === 'all'
                           ? 'border-brand-green font-bold text-gray-900'
                           : 'border-transparent font-medium text-gray-400 hover:text-gray-700'
                     }`}
                  >
                     전체
                  </button>
                  {categories.map((category) => (
                     <button
                        key={category.categoryId}
                        type="button"
                        onClick={() => handleTabChange(category.categoryId)}
                        className={`flex cursor-pointer items-center border-b-2 px-3 text-sm transition-colors ${
                           activeCategoryId === category.categoryId
                              ? 'border-brand-green font-bold text-gray-900'
                              : 'border-transparent font-medium text-gray-400 hover:text-gray-700'
                        }`}
                     >
                        {category.name}
                     </button>
                  ))}
                  {canManageCategories && (
                     <button
                        type="button"
                        onClick={() => setIsCategoryModalOpen(true)}
                        aria-label="카테고리 관리"
                        className="mt-1.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-sm px-1 text-gray-400 hover:bg-gray-50 hover:text-gray-700"
                     >
                        <Settings size={16} />
                     </button>
                  )}
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
                  <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
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
                  {isLoading ? (
                     <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-gray-400">
                           불러오는 중...
                        </td>
                     </tr>
                  ) : hasError ? (
                     <tr>
                        <td colSpan={7} className="px-6 py-16">
                           <div className="flex flex-col items-center gap-3">
                              <p className="text-sm text-gray-400">
                                 공지사항을 불러오는데 실패했습니다.
                              </p>
                              <button
                                 type="button"
                                 onClick={() => window.location.reload()}
                                 className="cursor-pointer rounded-xs border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                              >
                                 새로고침
                              </button>
                           </div>
                        </td>
                     </tr>
                  ) : pagedNotices.length === 0 ? (
                     <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-gray-400">
                           등록된 공지사항이 없습니다.
                        </td>
                     </tr>
                  ) : (
                     pagedNotices.map((notice, index) => {
                        const rowNumber = (currentPage - 1) * PAGE_SIZE + index + 1;

                        return (
                           <tr
                              key={notice.noticeId}
                              onClick={() => router.push(`/notices/${notice.noticeId}`)}
                              className={`cursor-pointer border-b border-[#F3F4F6] transition-colors last:border-b-0 hover:bg-[#F9FAFB] ${
                                 notice.pinned ? 'border-l-4 border-l-brand-maroon' : ''
                              }`}
                           >
                              <td className="px-6 py-4 text-gray-500">{rowNumber}</td>
                              <td className="px-6 py-4">
                                 {notice.pinned && (
                                    <div className="flex justify-center">
                                       <Pin size={14} className="text-brand-maroon" />
                                    </div>
                                 )}
                              </td>
                              <td className="px-6 py-4 text-left font-medium text-gray-900">
                                 {notice.title}
                              </td>
                              <td className="px-6 py-4 font-semibold">
                                 {notice.confirmedByMe ? (
                                    <span className="text-gray-500">완료</span>
                                 ) : (
                                    <span className="text-brand-maroon">미완료</span>
                                 )}
                              </td>
                              <td className="px-6 py-4 text-gray-700">{notice.categoryName}</td>
                              <td className="px-6 py-4 text-gray-700">
                                 {notice.authorName ?? '(알 수 없음)'}
                              </td>
                              <td className="px-6 py-4 text-gray-500">
                                 {formatNoticeDate(notice.createdAt)}
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
