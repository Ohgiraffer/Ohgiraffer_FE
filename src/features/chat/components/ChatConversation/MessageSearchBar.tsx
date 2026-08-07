'use client';

import { ChevronDown, ChevronUp, X } from 'lucide-react';

interface MessageSearchBarProps {
   query: string;
   onQueryChange: (value: string) => void;
   resultCount: number;
   activeIndex: number;
   onPrev: () => void;
   onNext: () => void;
   onClose: () => void;
}

export default function MessageSearchBar({
   query,
   onQueryChange,
   resultCount,
   activeIndex,
   onPrev,
   onNext,
   onClose,
}: MessageSearchBarProps) {
   return (
      <div className="flex items-center gap-2 border-b border-gray-200 p-3">
         <input
            autoFocus
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="메시지 검색"
            className="h-9 flex-1 rounded-sm border border-gray-200 px-3 text-sm text-gray-900 outline-none focus:border-gray-400"
         />
         {query && (
            <span className="w-10 shrink-0 text-center text-xs text-gray-400">
               {resultCount > 0 ? `${activeIndex + 1}/${resultCount}` : '0/0'}
            </span>
         )}
         <button
            type="button"
            onClick={onPrev}
            disabled={resultCount === 0}
            aria-label="이전 결과"
            className="cursor-pointer rounded-xs p-1 text-gray-400 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
         >
            <ChevronUp size={16} />
         </button>
         <button
            type="button"
            onClick={onNext}
            disabled={resultCount === 0}
            aria-label="다음 결과"
            className="cursor-pointer rounded-xs p-1 text-gray-400 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
         >
            <ChevronDown size={16} />
         </button>
         <button
            type="button"
            onClick={onClose}
            aria-label="검색 닫기"
            className="cursor-pointer rounded-xs p-1 text-gray-400 hover:bg-gray-100"
         >
            <X size={16} />
         </button>
      </div>
   );
}
