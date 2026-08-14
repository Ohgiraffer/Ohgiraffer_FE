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
