'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';

interface SearchInputProps {
   onSearch: (value: string) => void;
   placeholder: string;
   className?: string;
   initialValue?: string;
   heightClassName?: string;
   // 아래 세 개는 부모가 검색어를 직접 들고 있어야 하거나(예: 검색창 밖 X 버튼으로 초기화),
   // 타이핑할 때마다 바로 필터링해야 하는 경우(예: 채팅 메시지 검색)에만 넘긴다
   value?: string;
   onChange?: (value: string) => void;
   hideButton?: boolean;
   autoFocus?: boolean;
   // 검색창 자체는 작은데(h-8 이하) 버튼/아이콘은 기본 크기 그대로라 비례가 안 맞는 경우에 사용
   compact?: boolean;
}

// 검색창 공용 컴포넌트
export default function SearchInput({
   onSearch,
   placeholder,
   className = 'w-64',
   initialValue = '',
   heightClassName = 'h-10',
   value,
   onChange,
   hideButton = false,
   autoFocus = false,
   compact = false,
}: SearchInputProps) {
   const [inputValue, setInputValue] = useState(initialValue);
   const isControlled = value !== undefined;
   const displayValue = isControlled ? value : inputValue;

   const handleChange = (next: string) => {
      if (!isControlled) setInputValue(next);
      onChange?.(next);
   };

   const handleSubmit = () => {
      onSearch(displayValue.trim());
   };

   return (
      <div className={`relative ${className}`}>
         <input
            type="text"
            autoFocus={autoFocus}
            value={displayValue}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={(e) => {
               if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  handleSubmit();
               }
            }}
            placeholder={placeholder}
            className={`${heightClassName} w-full rounded-xs border border-gray-200 bg-white ${compact ? 'pl-3' : 'pl-5'} ${hideButton ? (compact ? 'pr-2' : 'pr-3') : compact ? 'pr-8' : 'pr-11'} text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-400`}
         />
         {!hideButton && (
            <button
               type="button"
               onClick={handleSubmit}
               aria-label="검색"
               className={`absolute ${compact ? 'right-1.5 p-1' : 'right-2.5 p-1.5'} top-1/2 -translate-y-1/2 rounded-xs text-gray-400 transition-colors hover:bg-brand-sage hover:text-white active:bg-brand-sage active:text-white`}
            >
               <Search size={compact ? 14 : 18} />
            </button>
         )}
      </div>
   );
}
