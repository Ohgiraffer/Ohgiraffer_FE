'use client';

type PaginationProps = {
   currentPage: number;
   totalPages: number;
   onPageChange: (page: number) => void;
};

const PAGE_WINDOW_SIZE = 5;

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
   if (totalPages <= 1) return null;

   const safePage = Math.min(Math.max(currentPage, 1), totalPages);

   const windowStart = Math.floor((safePage - 1) / PAGE_WINDOW_SIZE) * PAGE_WINDOW_SIZE + 1;
   const windowEnd = Math.min(windowStart + PAGE_WINDOW_SIZE - 1, totalPages);
   const pages = Array.from({ length: windowEnd - windowStart + 1 }, (_, i) => windowStart + i);

   const showPrevNext = totalPages >= PAGE_WINDOW_SIZE;

   return (
      <div className="flex items-center justify-center gap-1">
         {showPrevNext && (
            <button
               type="button"
               onClick={() => onPageChange(Math.max(1, safePage - 1))}
               disabled={safePage === 1}
               className="cursor-pointer rounded-sm px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
            >
               이전
            </button>
         )}

         {pages.map((page) => {
            const isActive = page === safePage;

            return (
               <button
                  key={page}
                  type="button"
                  onClick={() => onPageChange(page)}
                  // 활성 페이지 배경색은 트랜지션을 주지 않는다 - transition-colors를 걸면 페이지를
                  // 바꿀 때 이전 버튼(초록->없음)과 새 버튼(없음->초록)이 동시에 서서히 색이 바뀌면서
                  // 초록색이 버튼 사이를 미끄러지듯 옮겨가는 잔상처럼 보인다
                  className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-sm text-sm font-medium ${
                     isActive ? 'bg-brand-green text-white' : 'text-gray-700 hover:bg-[#EAF3EC]'
                  }`}
               >
                  {page}
               </button>
            );
         })}

         {showPrevNext && (
            <button
               type="button"
               onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
               disabled={safePage === totalPages}
               className="cursor-pointer rounded-sm px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
            >
               다음
            </button>
         )}
      </div>
   );
}
