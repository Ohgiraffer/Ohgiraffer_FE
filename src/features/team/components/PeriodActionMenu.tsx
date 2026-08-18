'use client';

import { useState } from 'react';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/shadcn/popover';

interface PeriodActionMenuProps {
   // 없으면 해당 항목 자체를 메뉴에서 뺀다(호출부가 둘 다 안 넘기면 이 컴포넌트를 아예 렌더하지 않음)
   onEdit?: () => void;
   onDelete?: () => void;
}

// 기간 탭마다 붙는 케밥 메뉴. TeamPeriodTabs의 가로 스크롤 컨테이너(overflow-x-auto) 안에 있는데,
// overflow-x를 auto로 주면 CSS 스펙상 overflow-y도 auto로 강제돼(visible로 못 둠) 직접 absolute로
// 띄우던 예전 방식은 메뉴가 스크롤 영역에 잘려 안 보였다. Popover는 내용을 document.body로
// 포탈링해서 그 클리핑을 벗어난다
export default function PeriodActionMenu({ onEdit, onDelete }: PeriodActionMenuProps) {
   const [isOpen, setIsOpen] = useState(false);

   return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
         <PopoverTrigger
            aria-label="기간 관리"
            className="cursor-pointer rounded-xs p-1 text-gray-300 hover:bg-gray-100 hover:text-gray-600"
         >
            <MoreVertical size={14} />
         </PopoverTrigger>
         <PopoverContent align="end" sideOffset={4} className="w-28 gap-0 rounded-xs! p-1!">
            {onEdit && (
               <button
                  type="button"
                  onClick={() => {
                     setIsOpen(false);
                     onEdit();
                  }}
                  className="flex w-full cursor-pointer items-center gap-1.5 rounded-xs px-3 py-1.5 text-left text-xs font-medium text-gray-700 hover:bg-gray-50"
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
                  className="flex w-full cursor-pointer items-center gap-1.5 rounded-xs px-3 py-1.5 text-left text-xs font-medium text-brand-maroon hover:bg-gray-50"
               >
                  <Trash2 size={12} />
                  삭제
               </button>
            )}
         </PopoverContent>
      </Popover>
   );
}
