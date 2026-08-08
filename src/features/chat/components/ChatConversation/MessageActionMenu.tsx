'use client';

import { useEffect, useRef, useState } from 'react';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageActionMenuProps {
   onEdit: () => void;
   onDelete: () => void;
}

// 메뉴(수정/삭제 두 항목) 높이의 대략치 - 버튼 아래 남은 공간이 이보다 부족하면 위로 열어서
// 채팅 입력창에 가려지지 않게 한다
const MENU_HEIGHT_ESTIMATE = 90;

export default function MessageActionMenu({ onEdit, onDelete }: MessageActionMenuProps) {
   const [isOpen, setIsOpen] = useState(false);
   const [openUpward, setOpenUpward] = useState(false);
   const containerRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      if (!isOpen) return;

      const handleClickOutside = (event: MouseEvent) => {
         if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
            setIsOpen(false);
         }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
   }, [isOpen]);

   const handleToggle = () => {
      if (!isOpen && containerRef.current) {
         const rect = containerRef.current.getBoundingClientRect();
         // 메시지 목록의 스크롤 영역을 기준으로 판단해야 입력창에 가려지는 걸 정확히 피할 수 있다
         const scrollParent = containerRef.current.closest('.overflow-y-auto');
         const boundaryBottom = scrollParent
            ? scrollParent.getBoundingClientRect().bottom
            : window.innerHeight;
         setOpenUpward(boundaryBottom - rect.bottom < MENU_HEIGHT_ESTIMATE);
      }
      setIsOpen((prev) => !prev);
   };

   return (
      <div ref={containerRef} className="relative">
         <button
            type="button"
            onClick={handleToggle}
            aria-label="메시지 더보기"
            className="cursor-pointer rounded-xs p-1 text-gray-400 hover:bg-gray-100"
         >
            <MoreVertical size={14} />
         </button>

         {isOpen && (
            <div
               className={cn(
                  'absolute right-0 z-10 w-28 rounded-xs border border-gray-200 bg-white py-1 shadow-md',
                  openUpward ? 'bottom-full mb-1' : 'top-full mt-1',
               )}
            >
               <button
                  type="button"
                  onClick={() => {
                     setIsOpen(false);
                     onEdit();
                  }}
                  className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50"
               >
                  <Pencil size={13} />
                  수정
               </button>
               <button
                  type="button"
                  onClick={() => {
                     setIsOpen(false);
                     onDelete();
                  }}
                  className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs font-medium text-brand-red hover:bg-gray-50"
               >
                  <Trash2 size={13} />
                  삭제
               </button>
            </div>
         )}
      </div>
   );
}
