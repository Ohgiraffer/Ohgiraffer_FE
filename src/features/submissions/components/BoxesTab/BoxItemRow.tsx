'use client';

import { X } from 'lucide-react';
import ToggleButton from '@/components/ui/ToggleButton';
import { cn } from '@/lib/utils';
import type { SubmissionItemType } from '../../types';

export interface ItemDraft {
   draftId: string;
   submissionBoxItemId: number | null;
   name: string;
   type: SubmissionItemType;
   hint: string;
   required: boolean;
}

// 항목명 / 파일 업로드 / 외부 링크 / 삭제 버튼 컬럼 너비 비율.
// 각 항목 행과 그 아래 힌트 입력란이 항상 같은 그리드를 써야 세로로 열이 어긋나지 않는다
const ITEM_GRID_COLUMNS =
   'grid-cols-1 sm:grid-cols-[24px_minmax(0,1.6fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_28px]';

interface BoxItemRowProps {
   item: ItemDraft;
   index: number;
   disableRemove: boolean;
   onUpdate: (patch: Partial<ItemDraft>) => void;
   onRemove: () => void;
}

export default function BoxItemRow({ item, index, disableRemove, onUpdate, onRemove }: BoxItemRowProps) {
   return (
      <div className="rounded-xs border border-gray-200 p-3">
         <div className={cn('grid items-start gap-3 sm:items-center', ITEM_GRID_COLUMNS)}>
            <div className="flex items-center gap-3 sm:contents">
               <span className="shrink-0 text-sm text-gray-400 sm:order-1">{index + 1}</span>
               <label htmlFor={`item-name-${item.draftId}`} className="sr-only">
                  항목 {index + 1} 이름
               </label>
               <input
                  id={`item-name-${item.draftId}`}
                  value={item.name}
                  onChange={(e) => onUpdate({ name: e.target.value })}
                  placeholder="항목명 (예: 발표자료)"
                  className="h-10 min-w-0 flex-1 rounded-xs border border-[#E5E7EB] px-3 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-green sm:order-2 sm:w-full"
               />
               <button
                  type="button"
                  onClick={onRemove}
                  disabled={disableRemove}
                  aria-label="항목 삭제"
                  className="shrink-0 cursor-pointer rounded-xs p-1.5 text-gray-400 hover:bg-gray-50 hover:text-brand-maroon disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400 sm:order-5"
               >
                  <X size={16} />
               </button>
            </div>
            <div className="flex gap-2 sm:contents">
               <ToggleButton
                  className="flex-1 sm:order-3 sm:flex-none"
                  selected={item.type === 'FILE'}
                  onClick={() => onUpdate({ type: 'FILE' })}
               >
                  파일 업로드
               </ToggleButton>
               <ToggleButton
                  className="flex-1 sm:order-4 sm:flex-none"
                  selected={item.type === 'LINK'}
                  onClick={() => onUpdate({ type: 'LINK' })}
               >
                  외부 링크
               </ToggleButton>
            </div>
         </div>
         <div className={cn('mt-2 grid gap-3', ITEM_GRID_COLUMNS)}>
            <span className="hidden sm:block" />
            <div className="flex min-w-0 items-center gap-3 sm:col-span-3">
               <div className="min-w-0 flex-1">
                  {item.type === 'FILE' ? (
                     <input
                        value={item.hint}
                        onChange={(e) => onUpdate({ hint: e.target.value })}
                        placeholder="허용 확장자 (예: pdf, pptx)"
                        className="h-9 w-full rounded-xs border border-[#E5E7EB] px-3 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-green"
                     />
                  ) : (
                     <p className="text-xs text-gray-400">→ 훈련생이 URL을 직접 입력합니다</p>
                  )}
               </div>
               <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs text-gray-600">
                  <input
                     type="checkbox"
                     checked={item.required}
                     onChange={(e) => onUpdate({ required: e.target.checked })}
                     className="h-3.5 w-3.5 cursor-pointer accent-brand-green"
                  />
                  필수 항목
               </label>
            </div>
         </div>
      </div>
   );
}
