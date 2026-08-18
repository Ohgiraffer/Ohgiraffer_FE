'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pin, Settings } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import SearchInput from '@/components/ui/SearchInput';
import Pagination from '@/components/ui/Pagination';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import { Skeleton } from '@/components/ui/loading/Skeleton';
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
   const queryClient = useQueryClient();
   const { role } = useAuth();
   const canManageCategories = role === 'INSTRUCTOR' || role === 'MANAGER';
   const canWriteNotice = role === 'INSTRUCTOR' || role === 'MANAGER';
   
   const {
      data: categories = [],
      isLoading: isLoadingCategories,
      isError: isCategoriesError,
   } = useQuery({
      queryKey: ['noticeCategories'],
      queryFn: getNoticeCategories,
   });
   const [notices, setNotices] = useState<NoticeListItem[]>([]);
   const [isLoadingNotices, setIsLoadingNotices] = useState(true);
   const [hasNoticesError, setHasNoticesError] = useState(false);
   const [activeCategoryId, setActiveCategoryId] = useState<number | 'all'>('all');
   const [keyword, setKeyword] = useState('');
   const [currentPage, setCurrentPage] = useState(1);
   const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
   const categoryScrollRef = useRef<HTMLDivElement>(null);
   const [canScrollCategories, setCanScrollCategories] = useState(false);

   const isLoading = isLoadingNotices || isLoadingCategories;
   const hasError = hasNoticesError || isCategoriesError;

   // 실제로 옆으로 넘치는 카테고리가 있을 때만 그라데이션을 보여준다 - ResizeObserver는 탭 목록
   // 컨테이너 자체 크기 변화(창 크기 등)를, categories 의존성은 카테고리 추가/삭제로 내용 너비만
   // 바뀌는 경우(컨테이너 크기는 그대로라 ResizeObserver가 못 잡음)를 각각 커버한다
   useEffect(() => {
      const el = categoryScrollRef.current;
      if (!el) return;

      const checkOverflow = () => setCanScrollCategories(el.scrollWidth > el.clientWidth);
      checkOverflow();

      const observer = new ResizeObserver(checkOverflow);
      observer.observe(el);
      return () => observer.disconnect();
   }, [categories]);

   useEffect(() => {
      let isMounted = true;

      getNotices()
         .then((noticeList) => {
            if (isMounted) setNotices(noticeList);
         })
         .catch(() => {
            if (isMounted) setHasNoticesError(true);
         })
         .finally(() => {
            if (isMounted) setIsLoadingNotices(false);
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
         queryClient.setQueryData<NoticeCategory[]>(['noticeCategories'], (prev = []) => [
            ...prev,
            created,
         ]);
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

      queryClient.setQueryData<NoticeCategory[]>(['noticeCategories'], (prev = []) =>
         prev.filter((category) => category.categoryId !== id),
      );
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
            <div className="flex flex-col border-b border-[#E5E7EB] sm:flex-row sm:items-stretch sm:justify-between">
               <div className="relative min-w-0 flex-1">
                  <div
                     ref={categoryScrollRef}
                     className="flex h-full items-stretch gap-4 overflow-x-auto px-6 pt-2 scrollbar-none [&::-webkit-scrollbar]:hidden"
                  >
                     <button
                        type="button"
                        onClick={() => handleTabChange('all')}
                        className={`flex shrink-0 cursor-pointer items-center border-b-2 px-3 text-sm transition-colors ${
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
                           className={`flex shrink-0 cursor-pointer items-center border-b-2 px-3 text-sm transition-colors ${
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
                           className="mt-1.5 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-sm px-1 text-gray-400 hover:bg-gray-50 hover:text-gray-700"
                        >
                           <Settings size={16} />
                        </button>
                     )}
                  </div>
                  {canScrollCategories && (
                     <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l from-brand-sage/15 to-transparent" />
                  )}
               </div>

               <div className="flex items-center px-6 py-2 sm:pl-0">
                  <SearchInput
                     onSearch={handleSearch}
                     placeholder="제목 또는 작성자 검색"
                     className="w-full sm:w-72"
                  />
               </div>
            </div>

            {isLoading ? (
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
                     {[0, 1, 2, 3, 4, 5].map((i) => (
                        <tr key={i} className="border-b border-[#F3F4F6] last:border-b-0">
                           <td className="px-6 py-4"><Skeleton width={16} height={14} className="mx-auto rounded-md" /></td>
                           <td className="px-6 py-4" />
                           <td className="px-6 py-4"><Skeleton width="70%" height={14} className="rounded-md" /></td>
                           <td className="px-6 py-4"><Skeleton width={36} height={14} className="mx-auto rounded-md" /></td>
                           <td className="px-6 py-4"><Skeleton width={48} height={14} className="mx-auto rounded-md" /></td>
                           <td className="px-6 py-4"><Skeleton width={48} height={14} className="mx-auto rounded-md" /></td>
                           <td className="px-6 py-4"><Skeleton width={64} height={14} className="mx-auto rounded-md" /></td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            ) : hasError ? (
               <div className="flex flex-col items-center gap-3 px-6 py-16">
                  <p className="text-sm text-gray-400">공지사항을 불러오는데 실패했습니다.</p>
                  <button
                     type="button"
                     onClick={() => window.location.reload()}
                     className="cursor-pointer rounded-xs border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                     새로고침
                  </button>
               </div>
            ) : pagedNotices.length === 0 ? (
               <div className="px-6 py-10 text-center text-gray-400">
                  등록된 공지사항이 없습니다.
               </div>
            ) : (
               <>
                  {/* 좁은 화면 - 카드형 목록 */}
                  <div className="divide-y divide-[#F3F4F6] md:hidden">
                     {pagedNotices.map((notice) => (
                        <div
                           key={notice.noticeId}
                           onClick={() => router.push(`/notices/${notice.noticeId}`)}
                           className={`cursor-pointer p-4 transition-colors hover:bg-[#F9FAFB] ${
                              notice.pinned ? 'border-l-4 border-l-brand-maroon' : ''
                           }`}
                        >
                           <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                 {notice.pinned && (
                                    <Pin size={13} className="size-3.25 shrink-0 text-brand-maroon" />
                                 )}
                                 <p className="text-sm font-medium text-gray-900">{notice.title}</p>
                              </div>
                              {notice.confirmedByMe ? (
                                 <span className="shrink-0 text-xs font-semibold text-gray-500">
                                    완료
                                 </span>
                              ) : (
                                 <span className="shrink-0 text-xs font-semibold text-brand-maroon">
                                    미완료
                                 </span>
                              )}
                           </div>
                           <p className="mt-1.5 text-xs text-gray-500">
                              {notice.categoryName} · {notice.authorName ?? '(알 수 없음)'} ·{' '}
                              {formatNoticeDate(notice.createdAt)}
                           </p>
                        </div>
                     ))}
                  </div>

                  {/* 넓은 화면 - 테이블 */}
                  <table className="hidden w-full table-fixed text-center text-sm md:table">
                     <thead>
                        <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
                           <th className="w-[6%] px-6 py-3 font-medium">#</th>
                           <th className="w-[8%] px-2 py-3 font-medium">고정</th>
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
                                 key={notice.noticeId}
                                 onClick={() => router.push(`/notices/${notice.noticeId}`)}
                                 className={`cursor-pointer border-b border-[#F3F4F6] transition-colors last:border-b-0 hover:bg-[#F9FAFB] ${
                                    notice.pinned ? 'border-l-4 border-l-brand-maroon' : ''
                                 }`}
                              >
                                 <td className="px-6 py-4 text-gray-500">{rowNumber}</td>
                                 <td className="px-2 py-4">
                                    {notice.pinned && (
                                       <div className="flex justify-center">
                                          <Pin size={14} className="size-3.5 shrink-0 text-brand-maroon" />
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
                        })}
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
