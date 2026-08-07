'use client';

import { useEffect, useRef, useState } from 'react';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';

interface MessageActionMenuProps {
   onEdit: () => void;
   onDelete: () => void;
}

export default function MessageActionMenu({ onEdit, onDelete }: MessageActionMenuProps) {
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
            aria-label="메시지 더보기"
            className="cursor-pointer rounded-xs p-1 text-gray-400 hover:bg-gray-100"
         >
            <MoreVertical size={14} />
         </button>

         {isOpen && (
            <div className="absolute top-full right-0 z-10 mt-1 w-28 rounded-xs border border-gray-200 bg-white py-1 shadow-md">
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
