'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, X } from 'lucide-react';

export type CategoryRow = {
   id: number;
   name: string;
   canDelete: boolean;
};

type Props = {
   open: boolean;
   onClose: () => void;
   categories: CategoryRow[];
   onAddCategory: (name: string) => Promise<void>;
   onRemoveCategory: (id: number) => Promise<void>;
};

export default function CategoryManageModal({
   open,
   onClose,
   categories,
   onAddCategory,
   onRemoveCategory,
}: Props) {
   const [newCategoryName, setNewCategoryName] = useState('');
   const [isAdding, setIsAdding] = useState(false);
   const [deletingId, setDeletingId] = useState<number | null>(null);

   const [prevOpen, setPrevOpen] = useState(open);
   if (open !== prevOpen) {
      setPrevOpen(open);
      if (!open) {
         setNewCategoryName('');
      }
   }

   useEffect(() => {
      if (!open) return;

      const handleKeyDown = (event: KeyboardEvent) => {
         if (event.key === 'Escape') onClose();
      };

      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      return () => {
         document.removeEventListener('keydown', handleKeyDown);
         document.body.style.overflow = '';
      };
   }, [open, onClose]);

   if (!open) return null;

   const handleAdd = async () => {
      const trimmed = newCategoryName.trim();
      if (!trimmed || isAdding) return;

      setIsAdding(true);
      try {
         await onAddCategory(trimmed);
         setNewCategoryName('');
      } catch {
         // 에러 토스트는 상위에서 띄워줌
      } finally {
         setIsAdding(false);
      }
   };

   const handleRemove = async (id: number) => {
      if (deletingId !== null) return;

      setDeletingId(id);
      try {
         await onRemoveCategory(id);
      } catch {
         // 에러 토스트는 상위에서 띄워줌
      } finally {
         setDeletingId(null);
      }
   };

   return createPortal(
      <div
         className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
         onClick={onClose}
      >
         <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-manage-modal-title"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-sm bg-white p-8 shadow-lg"
         >
            <div className="flex items-center justify-between">
               <h2 id="category-manage-modal-title" className="text-xl font-bold text-gray-900">
                  카테고리 관리
               </h2>
               <button
                  type="button"
                  onClick={onClose}
                  aria-label="닫기"
                  className="cursor-pointer rounded-sm p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-700"
               >
                  <X size={20} />
               </button>
            </div>

            <div className="mt-4 flex flex-col">
               <div className="border-b border-[#F3F4F6] px-3 py-3 text-sm font-medium text-gray-900">
                  전체
               </div>

               {categories.map((category) => (
                  <div
                     key={category.id}
                     className="flex items-center justify-between border-b border-[#F3F4F6] py-3"
                  >
                     <span className="px-3 text-sm font-medium text-gray-900">{category.name}</span>
                     <button
                        type="button"
                        disabled={!category.canDelete || deletingId !== null}
                        onClick={() => handleRemove(category.id)}
                        aria-label={`${category.name} 카테고리 삭제`}
                        className={`rounded-sm px-3 py-1 ${
                           category.canDelete && deletingId === null
                              ? 'cursor-pointer text-brand-maroon hover:bg-gray-50'
                              : 'cursor-not-allowed text-gray-300'
                        }`}
                     >
                        <Trash2 size={16} />
                     </button>
                  </div>
               ))}
            </div>

            <div className="mt-4 flex items-center gap-2">
               <input
                  type="text"
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                  disabled={isAdding}
                  onKeyDown={(event) => {
                     if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                        event.preventDefault();
                        handleAdd();
                     }
                  }}
                  placeholder="새 카테고리명"
                  className="w-full min-w-0 rounded-xs border border-[#E5E7EB] px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-green disabled:bg-gray-50 disabled:text-gray-400"
               />
               <button
                  type="button"
                  onClick={handleAdd}
                  disabled={isAdding}
                  className="shrink-0 cursor-pointer rounded-xs bg-brand-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#4D655A] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
               >
                  {isAdding ? '추가 중...' : '추가'}
               </button>
            </div>
         </div>
      </div>,
      document.body,
   );
}
