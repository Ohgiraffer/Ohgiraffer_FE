'use client';

import { cn } from '@/lib/utils';

interface ToggleButtonProps {
   selected: boolean;
   onClick: () => void;
   children: React.ReactNode;
   className?: string;
}

// 두 개 중 하나를 고르는 형태의 토글 버튼(제출 단위, 항목 유형 등에서 공용으로 쓰는 스타일)
export default function ToggleButton({ selected, onClick, children, className }: ToggleButtonProps) {
   return (
      <button
         type="button"
         onClick={onClick}
         aria-pressed={selected}
         className={cn(
            'w-full cursor-pointer rounded-xs border px-4 py-2.5 text-sm font-medium transition-colors',
            selected
               ? 'border-brand-green bg-[#EAF3EC] text-brand-green'
               : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50',
            className,
         )}
      >
         {children}
      </button>
   );
}
