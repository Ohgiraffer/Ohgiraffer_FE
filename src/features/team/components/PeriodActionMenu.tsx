'use client';

import { useEffect, useRef, useState } from 'react';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';

interface PeriodActionMenuProps {
   // 없으면 해당 항목 자체를 메뉴에서 뺀다(호출부가 둘 다 안 넘기면 이 컴포넌트를 아예 렌더하지 않음)
   onEdit?: () => void;
   onDelete?: () => void;
}

// 기간 탭마다 붙는 케밥 메뉴 - MemberActionMenu.tsx와 동일한 패턴(호버 없이 항상 노출,
// 바깥 클릭 시 닫힘)이라 터치 기기에서도 접근할 수 있다
export default function PeriodActionMenu({ onEdit, onDelete }: PeriodActionMenuProps) {
   const [isOpen, setIsOpen] = useState(false);
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

   return (
      <div ref={containerRef} className="relative">
         <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label="기간 관리"
            className="cursor-pointer rounded-xs p-1 text-gray-300 hover:bg-gray-100 hover:text-gray-600"
         >
            <MoreVertical size={14} />
         </button>

         {isOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 w-28 rounded-xs border border-gray-200 bg-white py-1 shadow-md">
               {onEdit && (
                  <button
                     type="button"
                     onClick={() => {
                        setIsOpen(false);
                        onEdit();
                     }}
                     className="flex w-full cursor-pointer items-center gap-1.5 px-3 py-1.5 text-left text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                     <Pencil size={12} />
                     수정
                  </button>
               )}
               {onDelete && (
                  <button
                     type="button"
                     onClick={() => {
                        setIsOpen(false);
                        onDelete();
                     }}
                     className="flex w-full cursor-pointer items-center gap-1.5 px-3 py-1.5 text-left text-xs font-medium text-brand-maroon hover:bg-gray-50"
                  >
                     <Trash2 size={12} />
                     삭제
                  </button>
               )}
            </div>
         )}
      </div>
   );
}
