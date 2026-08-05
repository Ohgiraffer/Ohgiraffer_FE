'use client';

type PaginationProps = {
   currentPage: number;
   totalPages: number;
   onPageChange: (page: number) => void;
};

const PAGE_WINDOW_SIZE = 5;

// 여러 페이지(사용자 관리, 변경 이력 등)에서 공통으로 쓰는 페이지네이션
export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
   if (totalPages <= 1) return null;

   // currentPage가 totalPages보다 큰 경우(필터링 등으로 목록이 줄었을 때)를 대비한 방어 처리
   const safePage = Math.min(Math.max(currentPage, 1), totalPages);

   // 한 번에 5페이지씩만 보여주고, 그 구간을 벗어나면 이전/다음으로 옆 구간으로 넘어감
   const windowStart = Math.floor((safePage - 1) / PAGE_WINDOW_SIZE) * PAGE_WINDOW_SIZE + 1;
   const windowEnd = Math.min(windowStart + PAGE_WINDOW_SIZE - 1, totalPages);
   const pages = Array.from({ length: windowEnd - windowStart + 1 }, (_, i) => windowStart + i);

   // 페이지가 5개 미만이면 한 화면에 다 보이므로 이전/다음 버튼은 5개 이상일 때만 노출
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
                  className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-sm text-sm font-medium transition-colors ${
                     isActive ? 'bg-brand-green text-white' : 'text-gray-700 hover:bg-gray-50'
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
